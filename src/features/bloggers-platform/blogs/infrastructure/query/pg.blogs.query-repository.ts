import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgBlogsViewDto } from '../../api/view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { ERRORS } from 'src/constants';

export type TPgBlog = {
  id: string;
  name: string;
  description: string;
  website_url: string;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date;
  is_membership: boolean;
};

@Injectable()
export class PgBlogsQueryRepository extends PgBaseRepository {
  private readonly allowedColumns = [
    'created_at',
    'name',
    'description',
    'website_url',
  ] as const;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async getBlogById(id: string): Promise<PgBlogsViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }
    const query = `
      SELECT * FROM blogs WHERE id = $1;
    `;
    const params = [id];
    const result = await this.dataSource.query(query, params);
    const blog: TPgBlog = result[0];

    return PgBlogsViewDto.mapToView(blog);
  }

  async findAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const [blogs, totalCount] = await Promise.all([
      this.findBlogs(query, sortColumn, sortDirection, limit, offset),
      this.getTotalCount(query),
    ]);

    return this.mapToPaginatedView(
      blogs,
      +totalCount[0].count,
      pageNumber,
      pageSize,
    );
  }

  private buildWhereClause(query: GetBlogsQueryParams): {
    baseConditions: string[];
    searchConditions: string[];
    params: (string | number)[];
  } {
    const { searchNameTerm } = query;
    const baseConditions = ['deleted_at IS NULL'];
    const searchConditions: string[] = [];
    const params: (string | number)[] = [];

    // ILIKE is case-insensitive
    if (searchNameTerm) {
      const value = `%${searchNameTerm}%`;
      params.push(value);
      searchConditions.push(`name ILIKE $${params.indexOf(value) + 1}`);
    }

    return { baseConditions, searchConditions, params };
  }

  private async findBlogs(
    query: GetBlogsQueryParams,
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<TPgBlog[]> {
    const { baseConditions, searchConditions, params } =
      this.buildWhereClause(query);

    params.push(limit, offset);

    const whereClause = baseConditions.join(' AND ');
    const searchClause =
      searchConditions.length > 0 ? ` AND ${searchConditions[0]}` : '';

    const sql = `
      SELECT *
      FROM public.blogs
      WHERE ${whereClause}${searchClause}
      ORDER BY blogs.${sortColumn} ${sortDirection}
      LIMIT $${params.indexOf(limit) + 1}
      OFFSET $${params.indexOf(offset) + 1}
    `;

    return this.dataSource.query(sql, params);
  }

  private async getTotalCount(
    query: GetBlogsQueryParams,
  ): Promise<[{ count: string }]> {
    const { baseConditions, searchConditions, params } =
      this.buildWhereClause(query);

    const whereClause = baseConditions.join(' AND ');
    const searchClause =
      searchConditions.length > 0 ? ` AND ${searchConditions[0]}` : '';

    return this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM public.blogs
      WHERE ${whereClause}${searchClause}
    `,
      params,
    );
  }

  private mapToPaginatedView(
    blogs: TPgBlog[],
    totalCount: number,
    pageNumber: number,
    pageSize: number,
  ): PaginatedViewDto<PgBlogsViewDto[]> {
    const items = blogs.map((blog) => PgBlogsViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
