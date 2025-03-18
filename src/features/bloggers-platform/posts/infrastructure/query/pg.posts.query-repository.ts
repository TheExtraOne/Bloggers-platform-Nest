import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgPostsViewDto } from '../../api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { ERRORS } from '../../../../../constants';
import { PgBlogsRepository } from '../../../blogs/infrastructure/pg.blogs.repository';

export type TPgPost = {
  id: string;
  title: string;
  short_description: string;
  content: string;
  blog_id: string;
  blog_name: string;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date;
  likes_count: number;
  dislikes_count: number;
  recent_likes: { userId: string; login: string; addedAt: Date }[];
};

@Injectable()
export class PgPostsQueryRepository extends PgBaseRepository {
  private allowedColumns = [
    'title',
    'short_description',
    'content',
    'blog_name',
    'created_at',
  ];
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private pgBlogsRepository: PgBlogsRepository,
  ) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto | null> {
    if (!this.isCorrectNumber(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const query = `
      SELECT 
          posts.*, 
          blogs.name AS blog_name, 
          likes.likes_count, 
          likes.dislikes_count,
          COALESCE(likes_details.likes, '[]') AS recent_likes
      FROM public.posts AS posts
      JOIN public.blogs AS blogs 
          ON posts.blog_id = blogs.id
      JOIN public.posts_likes_information AS likes
          ON posts.id = likes.post_id
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
              FROM public.likes AS post_likes
              WHERE post_likes.parent_id = posts.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true
      WHERE posts.id = $1
      AND posts.deleted_at IS NULL;
    `;
    const params = [postId];
    const result = await this.dataSource.query(query, params);
    const post = result[0];

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
    const blog = await this.pgBlogsRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const [posts, totalCount] = await Promise.all([
      this.findPostsByBlogId(blogId, sortColumn, sortDirection, limit, offset),
      this.getTotalCountForBlog(blogId),
    ]);

    return PaginatedViewDto.mapToView({
      items: posts,
      totalCount: +totalCount[0].count,
      page: pageNumber,
      size: pageSize,
    });
  }

  private async getTotalCountForBlog(
    blogId: string,
  ): Promise<[{ count: string }]> {
    return this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM public.posts
      WHERE posts.deleted_at IS NULL
      AND posts.blog_id = $1
    `,
      [blogId],
    );
  }

  async findAllPosts(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const [posts, totalCount] = await Promise.all([
      this.findPosts(sortColumn, sortDirection, limit, offset),
      this.getTotalCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: posts,
      totalCount: +totalCount[0].count,
      page: pageNumber,
      size: pageSize,
    });
  }

  private async getTotalCount(): Promise<[{ count: string }]> {
    return this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM public.posts
      WHERE posts.deleted_at IS NULL
    `,
    );
  }

  private async findPostsByBlogId(
    blogId: string,
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<PgPostsViewDto[]> {
    const query = `
      SELECT posts.*, blogs.name as blog_name, likes.likes_count, likes.dislikes_count, COALESCE(likes_details.likes, '[]') AS recent_likes
      FROM public.posts as posts
      JOIN public.blogs as blogs
      ON posts.blog_id = blogs.id
      JOIN public.posts_likes_information as likes
      ON posts.id = likes.post_id
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
              FROM public.likes AS post_likes
              WHERE post_likes.parent_id = posts.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true
      WHERE posts.blog_id = $1
      AND posts.deleted_at IS NULL
      ORDER BY posts.${sortColumn} ${sortDirection}
      LIMIT $2
      OFFSET $3
      `;
    const params = [blogId, limit, offset];
    const result: TPgPost[] = await this.dataSource.query(query, params);

    return result.map((post) => PgPostsViewDto.mapToView(post));
  }

  private async findPosts(
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<PgPostsViewDto[]> {
    const query = `
      SELECT posts.*, blogs.name as blog_name, likes.likes_count, likes.dislikes_count, COALESCE(likes_details.likes, '[]') AS recent_likes
      FROM public.posts as posts
      JOIN public.blogs as blogs
      ON posts.blog_id = blogs.id
      JOIN public.posts_likes_information as likes
      ON posts.id = likes.post_id
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
              FROM public.likes AS post_likes
              WHERE post_likes.parent_id = posts.id
              AND post_likes.like_status = 'Like'
              ORDER BY post_likes.created_at DESC
              LIMIT 3
          ) AS post_likes
          JOIN public.users AS users
              ON post_likes.user_id = users.id
      ) AS likes_details ON true
      WHERE posts.deleted_at IS NULL
      ORDER BY ${sortColumn === 'blog_name' ? 'blogs.name' : `posts.${sortColumn}`} ${sortDirection}
      LIMIT $1
      OFFSET $2
      `;
    const params = [limit, offset];
    const result: TPgPost[] = await this.dataSource.query(query, params);

    return result.map((post) => PgPostsViewDto.mapToView(post));
  }
}
