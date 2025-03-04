import { Injectable } from '@nestjs/common';
import { PGUserViewDto } from '../../api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users.query-params.input-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type TPgUser = {
  id: string;
  login: string;
  email: string;
  password_hash: string;
  created_at: string;
  deleted_at: string | null;
  updated_at: string;
};

@Injectable()
export class PgUsersQueryRepository {
  private readonly allowedColumns = ['created_at', 'login', 'email'] as const;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<PGUserViewDto[]>> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    const sortColumn = this.getSortColumn(sortBy);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const [users, totalCount] = await Promise.all([
      this.findUsers(query, sortColumn, sortDirection, limit, offset),
      this.getTotalCount(),
    ]);

    return this.mapToPaginatedView(
      users,
      +totalCount[0].count,
      pageNumber,
      pageSize,
    );
  }

  private getSortColumn(sortBy: string): string {
    const sortBySnakeCase = this.convertCamelToSnake(sortBy);
    return this.allowedColumns.includes(
      sortBySnakeCase as (typeof this.allowedColumns)[number],
    )
      ? sortBySnakeCase
      : 'created_at';
  }

  private buildWhereClause(query: GetUsersQueryParams): {
    baseConditions: string[];
    searchConditions: string[];
    params: (string | number)[];
  } {
    const { searchLoginTerm, searchEmailTerm } = query;
    const baseConditions = ['deleted_at IS NULL'];
    const searchConditions: string[] = [];
    const params: (string | number)[] = [];

    if (searchLoginTerm) {
      const value = `%${searchLoginTerm}%`;
      params.push(value);
      searchConditions.push(`login LIKE $${params.indexOf(value) + 1}`);
    }

    if (searchEmailTerm) {
      const value = `%${searchEmailTerm}%`;
      params.push(value);
      searchConditions.push(`email LIKE $${params.indexOf(value) + 1}`);
    }

    return { baseConditions, searchConditions, params };
  }

  private getPaginationParams(pageNumber: number, pageSize: number) {
    return {
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    };
  }

  private async findUsers(
    query: GetUsersQueryParams,
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<TPgUser[]> {
    const { baseConditions, searchConditions, params } =
      this.buildWhereClause(query);

    params.push(limit, offset);

    const whereClause = baseConditions.join(' AND ');
    const searchClause =
      searchConditions.length > 0
        ? ` AND (${searchConditions.join(' OR ')})`
        : '';

    const sql = `
      SELECT *
      FROM public.users
      WHERE ${whereClause}${searchClause}
      ORDER BY users.${sortColumn} ${sortDirection}
      LIMIT $${params.indexOf(limit) + 1}
      OFFSET $${params.indexOf(offset) + 1}
    `;

    return this.dataSource.query(sql, params);
  }

  private async getTotalCount(): Promise<[{ count: string }]> {
    return this.dataSource.query(`
      SELECT COUNT(*)
      FROM public.users
      WHERE deleted_at IS NULL
    `);
  }

  private mapToPaginatedView(
    users: TPgUser[],
    totalCount: number,
    pageNumber: number,
    pageSize: number,
  ): PaginatedViewDto<PGUserViewDto[]> {
    const items = users.map((user) => PGUserViewDto.mapToView(user));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  private convertCamelToSnake(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
}
