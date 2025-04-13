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

    // Used query builder in order to avoid extra mapping
    const blog: PgBlogsViewDto | undefined = await this.blogsRepository
      .createQueryBuilder('blog')
      .select([
        'blog.id::text AS id', // cast to text, alias as `id`
        'blog.name AS name',
        'blog.description AS description',
        'blog.websiteUrl AS "websiteUrl"',
        'blog.createdAt AS "createdAt"',
        'blog.isMembership AS "isMembership"',
      ])
      .where('blog.id = :id', { id: +id })
      .getRawOne();

    if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return blog;
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

    // Used query builder in order to avoid extra mapping
    const builder = this.blogsRepository
      .createQueryBuilder('blog')
      .select([
        'blog.id::text AS id', // cast to text, alias as `id`
        'blog.name AS name',
        'blog.description AS description',
        'blog.websiteUrl AS "websiteUrl"',
        'blog.createdAt AS "createdAt"',
        'blog.isMembership AS "isMembership"',
      ])
      .orderBy(`blog.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit);

    if (searchNameTerm) {
      builder.where('blog.name ILIKE :name', { name: `%${searchNameTerm}%` });
    }

    const totalCountBuilder =
      this.blogsRepository.createQueryBuilder('blogCount');

    if (searchNameTerm) {
      totalCountBuilder.where('blogCount.name ILIKE :name', {
        name: `%${searchNameTerm}%`,
      });
    }

    const [blogs, totalCount]: [PgBlogsViewDto[], number] = await Promise.all([
      builder.getRawMany(),
      totalCountBuilder.getCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: blogs,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
