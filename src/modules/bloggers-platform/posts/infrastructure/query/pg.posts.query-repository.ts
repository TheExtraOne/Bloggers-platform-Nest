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
    const query = `
    WITH like_counts AS (
      SELECT
        post_id,
        COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
        COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
      FROM public.post_likes
      GROUP BY post_id
    ),
    recent_likes AS (
      SELECT pl.post_id, pl.user_id, pl.created_at
      FROM public.post_likes pl
      WHERE pl.like_status = 'Like'
      AND pl.post_id = $1
      ORDER BY pl.created_at DESC
      LIMIT 3
    ),
    like_details AS (
      SELECT 
        recent_likes.post_id,
        json_agg(
          json_build_object(
            'userId', users.id::text,
            'login', users.login,
            'addedAt', recent_likes.created_at
          ) ORDER BY recent_likes.created_at DESC
        ) AS likes
      FROM recent_likes
      JOIN public.users ON users.id = recent_likes.user_id
      GROUP BY recent_likes.post_id
    )
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
    ) AS post
    FROM public.posts
    LEFT JOIN public.blogs ON posts.blog_id = blogs.id
    LEFT JOIN like_counts ON like_counts.post_id = posts.id
    LEFT JOIN like_details ON like_details.post_id = posts.id
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
    WITH base_posts AS (
      SELECT posts.*, blogs.name as blog_name
      FROM public.posts
      LEFT JOIN public.blogs ON posts.blog_id = blogs.id
      WHERE posts.blog_id = $1 AND posts.deleted_at IS NULL
    ),
    like_counts AS (
      SELECT
        post_id,
        COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
        COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
      FROM public.post_likes
      GROUP BY post_id
    ),
    recent_likes AS (
      SELECT pl.post_id, pl.user_id, pl.created_at
      FROM public.post_likes pl
      WHERE pl.like_status = 'Like'
      AND pl.post_id IN (SELECT id FROM base_posts)
    ),
    like_details AS (
      SELECT 
        recent_likes.post_id,
        json_agg(
          json_build_object(
            'userId', users.id::text,
            'login', users.login,
            'addedAt', recent_likes.created_at
          ) ORDER BY recent_likes.created_at DESC
        ) AS likes
      FROM (
        SELECT pl.*
        FROM recent_likes pl
        WHERE (SELECT COUNT(*) 
               FROM recent_likes pl2 
               WHERE pl2.post_id = pl.post_id 
               AND pl2.created_at >= pl.created_at) <= 3
      ) recent_likes
      JOIN public.users ON users.id = recent_likes.user_id
      GROUP BY recent_likes.post_id
    ),
    post_data AS (
      SELECT json_build_object(
        'id', bp.id::text,
        'title', bp.title,
        'shortDescription', bp.short_description,
        'content', bp.content,
        'createdAt', bp.created_at,
        'blogId', bp.blog_id::text,
        'blogName', bp.blog_name,
        'extendedLikesInfo', json_build_object(
          'likesCount', COALESCE(like_counts.likes_count, 0),
          'dislikesCount', COALESCE(like_counts.dislikes_count, 0),
          'myStatus', 'None',
          'newestLikes', COALESCE(like_details.likes, '[]')
        )
      ) AS post_data
      FROM base_posts bp
      LEFT JOIN like_counts ON like_counts.post_id = bp.id
      LEFT JOIN like_details ON like_details.post_id = bp.id
      ORDER BY bp.${sortColumn} ${sortDirection}
      LIMIT $2
      OFFSET $3
    )
    SELECT json_agg(post_data ORDER BY post_data->>'${sortColumn}' ${sortDirection}) AS posts
    FROM post_data;
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
    WITH base_posts AS (
      SELECT posts.*, blogs.name as blog_name
      FROM public.posts
      LEFT JOIN public.blogs ON posts.blog_id = blogs.id
      WHERE posts.deleted_at IS NULL
    ),
    like_counts AS (
      SELECT
        post_id,
        COUNT(CASE WHEN like_status = 'Like' THEN 1 END) AS likes_count,
        COUNT(CASE WHEN like_status = 'Dislike' THEN 1 END) AS dislikes_count
      FROM public.post_likes
      GROUP BY post_id
    ),
    recent_likes AS (
      SELECT pl.post_id, pl.user_id, pl.created_at
      FROM public.post_likes pl
      WHERE pl.like_status = 'Like'
      AND pl.post_id IN (SELECT id FROM base_posts)
    ),
    like_details AS (
      SELECT 
        recent_likes.post_id,
        json_agg(
          json_build_object(
            'userId', users.id::text,
            'login', users.login,
            'addedAt', recent_likes.created_at
          ) ORDER BY recent_likes.created_at DESC
        ) AS likes
      FROM (
        SELECT pl.*
        FROM recent_likes pl
        WHERE (SELECT COUNT(*) 
               FROM recent_likes pl2 
               WHERE pl2.post_id = pl.post_id 
               AND pl2.created_at >= pl.created_at) <= 3
      ) recent_likes
      JOIN public.users ON users.id = recent_likes.user_id
      GROUP BY recent_likes.post_id
    ),
    post_data AS (
      SELECT json_build_object(
        'id', bp.id::text,
        'title', bp.title,
        'shortDescription', bp.short_description,
        'content', bp.content,
        'createdAt', bp.created_at,
        'blogId', bp.blog_id::text,
        'blogName', bp.blog_name,
        'extendedLikesInfo', json_build_object(
          'likesCount', COALESCE(like_counts.likes_count, 0),
          'dislikesCount', COALESCE(like_counts.dislikes_count, 0),
          'myStatus', 'None',
          'newestLikes', COALESCE(like_details.likes, '[]')
        )
      ) AS post_data
      FROM base_posts bp
      LEFT JOIN like_counts ON like_counts.post_id = bp.id
      LEFT JOIN like_details ON like_details.post_id = bp.id
      ORDER BY ${sortColumn === 'blog_name' ? 'bp.blog_name' : `bp.${sortColumn}`} ${sortDirection}
      LIMIT $1
      OFFSET $2
    )
    SELECT json_agg(post_data ORDER BY ${sortColumn === 'blog_name' ? 'post_data->>\'blogName\'' : `post_data->>'${sortColumn}'`} ${sortDirection}) AS posts
    FROM post_data;`;

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
