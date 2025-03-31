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

// TODO: delete
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
    'created_at',
  ];
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private pgBlogsRepository: PgBlogsRepository,
    @InjectRepository(Posts)
    private readonly postsRepository: Repository<Posts>,
  ) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto | null> {
    if (!this.isCorrectUuid(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    // const query = `
    //   WITH post_counts AS (
    //       SELECT
    //           posts.*,
    //           blogs.name AS blog_name,
    //           COUNT(CASE WHEN l.like_status = 'Like' THEN 1 END) as likes_count,
    //           COUNT(CASE WHEN l.like_status = 'Dislike' THEN 1 END) as dislikes_count
    //       FROM public.posts AS posts
    //       JOIN public.blogs AS blogs
    //           ON posts.blog_id = blogs.id
    //       LEFT JOIN public.likes as l
    //           ON posts.id = l.parent_id
    //       WHERE posts.id = $1
    //       AND posts.deleted_at IS NULL
    //       GROUP BY posts.id, blogs.name
    //   )
    //   SELECT
    //       p.*,
    //       COALESCE(likes_details.likes, '[]') AS recent_likes
    //   FROM post_counts p
    //   LEFT JOIN LATERAL (
    //       SELECT json_agg(
    //           json_build_object(
    //               'userId', users.id,
    //               'login', users.login,
    //               'addedAt', post_likes.created_at
    //           ) ORDER BY post_likes.created_at DESC
    //       ) AS likes
    //       FROM (
    //           SELECT post_likes.user_id, post_likes.created_at
    //           FROM public.likes AS post_likes
    //           WHERE post_likes.parent_id = p.id
    //           AND post_likes.like_status = 'Like'
    //           ORDER BY post_likes.created_at DESC
    //           LIMIT 3
    //       ) AS post_likes
    //       JOIN public.users AS users
    //           ON post_likes.user_id = users.id
    //   ) AS likes_details ON true;
    // `;
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
      .orderBy(`post.${sortColumn}`, upperCaseSortDirection)
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
  // TODO
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
  // TODO
  private async getTotalCount(): Promise<[{ count: string }]> {
    return this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM public.posts
      WHERE posts.deleted_at IS NULL
    `,
    );
  }
  // TODO
  private async findPosts(
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<PgPostsViewDto[]> {
    const query = `
      WITH post_counts AS (
          SELECT 
              posts.*, 
              blogs.name as blog_name, 
              COUNT(CASE WHEN l.like_status = 'Like' THEN 1 END) as likes_count,
              COUNT(CASE WHEN l.like_status = 'Dislike' THEN 1 END) as dislikes_count
          FROM public.posts as posts
          JOIN public.blogs as blogs
              ON posts.blog_id = blogs.id
          LEFT JOIN public.likes as l
              ON posts.id = l.parent_id
          WHERE posts.deleted_at IS NULL
          GROUP BY posts.id, blogs.name
      )
      SELECT 
          p.*,
          COALESCE(likes_details.likes, '[]') AS recent_likes
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
              FROM public.likes AS post_likes
              WHERE post_likes.parent_id = p.id
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
    const result: TPgPost[] = await this.dataSource.query(query, params);

    return result.map((post) =>
      PgPostsViewDto.mapToView(post as unknown as Posts),
    );
  }
}
