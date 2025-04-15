import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto> {
    if (!this.isCorrectNumber(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const query = `SELECT json_build_object(
      'id', posts.id::text,
      'title', posts.title,
      'shortDescription', posts.short_description,
      'content', posts.content,
      'createdAt', posts.created_at,
      'blogId', posts.blog_id::text,
      'blogName', blogs.name,
      'extendedLikesInfo', json_build_object(
        'likesCount', COALESCE(like_counts.likes_count, 0),
        'dislikesCount', COALESCE(like_counts.dislikes_count, 0),
        'myStatus', 'None',
        'newestLikes', COALESCE(like_details.likes, '[]')
      )
    ) AS post
    FROM public.posts
    LEFT JOIN public.blogs ON posts.blog_id = blogs.id
    
    -- Like/dislike counts
    LEFT JOIN (
      SELECT
        post_id,
        COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
        COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
      FROM public.post_likes
      GROUP BY post_id
    ) AS like_counts ON like_counts.post_id = posts.id
    
    -- Nested like details
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'userId', users.id::text,
          'login', users.login,
          'addedAt', pl.created_at
        ) ORDER BY pl.created_at DESC
      ) AS likes
      FROM (
        SELECT pl.user_id, pl.created_at
        FROM public.post_likes pl
        WHERE pl.post_id = posts.id AND pl.like_status = 'Like'
        ORDER BY pl.created_at DESC
        LIMIT 3
      ) AS pl
      JOIN public.users ON users.id = pl.user_id
    ) AS like_details ON true
    
    WHERE posts.id = $1 AND posts.deleted_at IS NULL;`;

    const params = [postId];
    const result = await this.dataSource.query(query, params);
    const post: PgPostsViewDto = result[0]?.post || null;

    if (!post) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }

    return post;
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
    SELECT json_agg(post_data) AS posts
    FROM (
      SELECT json_build_object(
        'id', posts.id::text,
        'title', posts.title,
        'shortDescription', posts.short_description,
        'content', posts.content,
        'createdAt', posts.created_at,
        'blogId', posts.blog_id::text,
        'blogName', blogs.name,
        'extendedLikesInfo', json_build_object(
          'likesCount', COALESCE(like_counts.likes_count, 0),
          'dislikesCount', COALESCE(like_counts.dislikes_count, 0),
          'myStatus', 'None',
          'newestLikes', COALESCE(like_details.likes, '[]')
        )
      ) AS post_data
      FROM public.posts
      LEFT JOIN public.blogs ON posts.blog_id = blogs.id

      -- subquery to count likes/dislikes
      LEFT JOIN (
        SELECT
          post_id,
          COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
          COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
        FROM public.post_likes
        GROUP BY post_id
      ) AS like_counts ON like_counts.post_id = posts.id

      -- subquery to build newestLikes array
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'userId', users.id::text,
            'login', users.login,
            'addedAt', pl.created_at
          ) ORDER BY pl.created_at DESC
        ) AS likes
        FROM (
          SELECT pl.user_id, pl.created_at
          FROM public.post_likes pl
          WHERE pl.post_id = posts.id AND pl.like_status = 'Like'
          ORDER BY pl.created_at DESC
          LIMIT 3
        ) AS pl
        JOIN public.users ON users.id = pl.user_id
      ) AS like_details ON true

      WHERE posts.blog_id = $1 AND posts.deleted_at IS NULL
      ORDER BY posts.${sortColumn} ${sortDirection}
      LIMIT $2
      OFFSET $3
    ) AS subquery;
    `;
    const params = [blogId, limit, offset];
    const [posts, totalCount]: [[{ posts: PgPostsViewDto[] }], number] =
      await Promise.all([
        this.dataSource.query(querySQL, params),
        this.postsRepository.count({
          where: {
            blog: {
              id: +blogId,
            },
          },
        }),
      ]);

    return PaginatedViewDto.mapToView({
      items: posts[0]?.posts ?? [],
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
    const querySQL = `
    SELECT json_agg(post_data) AS posts
    FROM (
      SELECT json_build_object(
        'id', posts.id::text,
        'title', posts.title,
        'shortDescription', posts.short_description,
        'content', posts.content,
        'createdAt', posts.created_at,
        'blogId', posts.blog_id::text,
        'blogName', blogs.name,
        'extendedLikesInfo', json_build_object(
          'likesCount', COALESCE(like_counts.likes_count, 0),
          'dislikesCount', COALESCE(like_counts.dislikes_count, 0),
          'myStatus', 'None',
          'newestLikes', COALESCE(like_details.likes, '[]')
        )
      ) AS post_data
    FROM public.posts
    LEFT JOIN public.blogs ON posts.blog_id = blogs.id

    -- Like/dislike counts
    LEFT JOIN (
      SELECT
        post_id,
        COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
        COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
      FROM public.post_likes
      GROUP BY post_id
    ) AS like_counts ON like_counts.post_id = posts.id
    
    -- Nested like details
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'userId', users.id::text,
          'login', users.login,
          'addedAt', pl.created_at
        ) ORDER BY pl.created_at DESC
      ) AS likes
      FROM (
        SELECT pl.user_id, pl.created_at
        FROM public.post_likes pl
        WHERE pl.post_id = posts.id AND pl.like_status = 'Like'
        ORDER BY pl.created_at DESC
        LIMIT 3
      ) AS pl
      JOIN public.users ON users.id = pl.user_id
    ) AS like_details ON true
    
    WHERE posts.deleted_at IS NULL
    ORDER BY ${sortColumn === 'blog_name' ? 'blogs.name' : `posts.${sortColumn}`} ${sortDirection}
    LIMIT $1
    OFFSET $2
    ) AS subquery;`;

    const params = [limit, offset];
    const [posts, totalCount]: [[{ posts: PgPostsViewDto[] }], number] =
      await Promise.all([
        this.dataSource.query(querySQL, params),
        this.postsRepository.count(),
      ]);

    return PaginatedViewDto.mapToView({
      items: posts[0]?.posts ?? [],
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
