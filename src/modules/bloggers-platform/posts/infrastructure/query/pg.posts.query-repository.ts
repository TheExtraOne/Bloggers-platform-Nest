import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgPostsViewDto, TPost } from '../../api/view-dto/posts.view-dto';
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
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto> {
    if (!this.isCorrectNumber(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const query = `
      WITH post_counts AS (
          SELECT
              posts.*,
              blogs.name AS blog_name,
              COUNT(CASE WHEN l.like_status = 'Like' THEN 1 END) as likes_count,
              COUNT(CASE WHEN l.like_status = 'Dislike' THEN 1 END) as dislikes_count
          FROM public.posts AS posts
          JOIN public.blogs AS blogs
              ON posts.blog_id = blogs.id
          LEFT JOIN public.post_likes as l
              ON posts.id = l.post_id
          WHERE posts.id = $1
          AND posts.deleted_at IS NULL
          GROUP BY posts.id, blogs.name
      )
      SELECT
          p.*,
          COALESCE(likes_details.likes, '[]') AS newest_likes
      FROM post_counts p
      LEFT JOIN LATERAL (
          SELECT json_agg(
              json_build_object(
                  'userId', users.id,
                  'login', users.login,
                  'addedAt', post_likes.created_at
              ) ORDER BY post_likes.created_at DESC
          ) AS likes
          FROM (
              SELECT post_likes.user_id, post_likes.created_at
              FROM public.post_likes AS post_likes
              WHERE post_likes.post_id = p.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true;
    `;

    const params = [postId];
    const result = await this.dataSource.query(query, params);
    const post: TPost = result[0];

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

    const querySQL = `
      WITH post_counts AS (
          SELECT
              posts.*,
              blogs.name as blog_name,
              COUNT(CASE WHEN l.like_status = 'Like' THEN 1 END) as likes_count,
              COUNT(CASE WHEN l.like_status = 'Dislike' THEN 1 END) as dislikes_count
          FROM public.posts as posts
          JOIN public.blogs as blogs
              ON posts.blog_id = blogs.id
          LEFT JOIN public.post_likes as l
              ON posts.id = l.post_id
          WHERE posts.blog_id = $1
          AND posts.deleted_at IS NULL
          GROUP BY posts.id, blogs.name
      )
      SELECT
          p.*,
          COALESCE(likes_details.likes, '[]') AS newest_likes
      FROM post_counts p
      LEFT JOIN LATERAL (
          SELECT json_agg(
              json_build_object(
                  'userId', users.id,
                  'login', users.login,
                  'addedAt', post_likes.created_at
              ) ORDER BY post_likes.created_at DESC
          ) AS likes
          FROM (
              SELECT post_likes.user_id, post_likes.created_at
              FROM public.post_likes AS post_likes
              WHERE post_likes.post_id = p.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true
      ORDER BY p.${sortColumn} ${sortDirection}
      LIMIT $2
      OFFSET $3
    `;
    const params = [blogId, limit, offset];
    const [posts, totalCount] = await Promise.all([
      this.dataSource.query(querySQL, params),
      this.postsRepository.count({
        where: {
          blog: {
            id: +blogId,
          },
        },
      }),
    ]);

    const items = (posts as TPost[]).map((post) =>
      PgPostsViewDto.mapToView(post),
    );
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

    const querySql = `
      WITH post_counts AS (
          SELECT
              posts.*,
              blogs.name as blog_name,
              COUNT(CASE WHEN l.like_status = 'Like' THEN 1 END) as likes_count,
              COUNT(CASE WHEN l.like_status = 'Dislike' THEN 1 END) as dislikes_count
          FROM public.posts as posts
          JOIN public.blogs as blogs
              ON posts.blog_id = blogs.id
          LEFT JOIN public.post_likes as l
              ON posts.id = l.post_id
          WHERE posts.deleted_at IS NULL
          GROUP BY posts.id, blogs.name
      )
      SELECT
          p.*,
          COALESCE(likes_details.likes, '[]') AS newest_likes
      FROM post_counts p
      LEFT JOIN LATERAL (
          SELECT json_agg(
              json_build_object(
                  'userId', users.id,
                  'login', users.login,
                  'addedAt', post_likes.created_at
              ) ORDER BY post_likes.created_at DESC
          ) AS likes
          FROM (
              SELECT post_likes.user_id, post_likes.created_at
              FROM public.post_likes AS post_likes
              WHERE post_likes.post_id = p.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true
      ORDER BY ${sortColumn === 'blog_name' ? 'p.blog_name' : `p.${sortColumn}`} ${sortDirection}
      LIMIT $1
      OFFSET $2
    `;
    const params = [limit, offset];
    const [posts, totalCount] = await Promise.all([
      this.dataSource.query(querySql, params),
      this.postsRepository.count(),
    ]);

    const items = (posts as TPost[]).map((post) =>
      PgPostsViewDto.mapToView(post),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
