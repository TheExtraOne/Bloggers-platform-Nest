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
      return null;
    }
    const query = `
    SELECT posts.*, blogs.name as blog_name
    FROM public.posts as posts
    JOIN public.blogs as blogs 
    ON posts.blog_id = blogs.id
    WHERE posts.id = $1
    AND posts.deleted_at IS NULL
    `;
    const params = [postId];
    const result = await this.dataSource.query(query, params);
    console.log(result);
    const post = result[0];

    return post ? PgPostsViewDto.mapToView(post) : null;
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
      this.findPosts(blogId, sortColumn, sortDirection, limit, offset),
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

  private async findPosts(
    blogId: string,
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<PgPostsViewDto[]> {
    const query = `
      SELECT posts.*, blogs.name as blog_name
      FROM public.posts as posts
      JOIN public.blogs as blogs
      ON posts.blog_id = blogs.id
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
}
