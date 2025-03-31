import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgBlogsViewDto } from '../../api/view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { ERRORS } from 'src/constants';
import { Blogs } from '../../domain/entities/blog.entity';

@Injectable()
export class PgBlogsQueryRepository extends PgBaseRepository {
  private readonly allowedColumns = [
    'created_at',
    'name',
    'description',
    'website_url',
  ] as const;

  constructor(
    @InjectRepository(Blogs)
    private readonly blogsRepository: Repository<Blogs>,
  ) {
    super();
  }

  async getBlogById(id: string): Promise<PgBlogsViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const blog: Blogs | null = await this.blogsRepository.findOneBy({
      id: +id,
    });
    if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return PgBlogsViewDto.mapToView(blog);
  }

  async findAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    const { sortBy, sortDirection, searchNameTerm, pageNumber, pageSize } =
      query;

    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    const builder = this.blogsRepository
      .createQueryBuilder('blog')
      .orderBy(`blog.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit);

    if (searchNameTerm) {
      builder.where('blog.name ILIKE :name', { name: `%${searchNameTerm}%` });
    }

    const [blogs, totalCount] = await builder.getManyAndCount();

    const items = blogs.map((blog) => PgBlogsViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
