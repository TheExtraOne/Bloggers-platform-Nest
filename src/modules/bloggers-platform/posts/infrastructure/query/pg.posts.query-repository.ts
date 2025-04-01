import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgPostsViewDto } from '../../api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { ERRORS } from '../../../../../constants';
import { PgBlogsRepository } from '../../../blogs/infrastructure/pg.blogs.repository';
import { Posts } from '../../domain/entities/post.entity';

@Injectable()
export class PgPostsQueryRepository extends PgBaseRepository {
  private allowedColumns = [
    'title',
    'short_description',
    'content',
    'created_at',
    'blog_name',
  ];
  constructor(
    private pgBlogsRepository: PgBlogsRepository,
    @InjectRepository(Posts)
    private readonly postsRepository: Repository<Posts>,
  ) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto> {
    if (!this.isCorrectUuid(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }

    const post: Posts | null = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
      relations: ['blog'],
    });

    if (!post) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }

    return PgPostsViewDto.mapToView(post);
  }

  async findAllPostsForBlogId(
    blogId: string,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    // Check that blog exists
    const blogExists = await this.pgBlogsRepository.checkBlogExists(blogId);
    if (!blogExists) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    const builder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.blog.id = :blogId', { blogId: +blogId })
      .orderBy(
        `${sortColumn === 'blog_name' ? 'blog.name' : `post.${sortColumn}`}`,
        upperCaseSortDirection,
      )
      .offset(offset)
      .limit(limit);

    const [posts, totalCount] = await builder.getManyAndCount();
    const items = posts.map((post) => PgPostsViewDto.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async findAllPosts(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    const builder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .orderBy(
        `${sortColumn === 'blog_name' ? 'blog.name' : `post.${sortColumn}`}`,
        upperCaseSortDirection,
      )
      .offset(offset)
      .limit(limit);

    const [posts, totalCount] = await builder.getManyAndCount();
    const items = posts.map((post) => PgPostsViewDto.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
