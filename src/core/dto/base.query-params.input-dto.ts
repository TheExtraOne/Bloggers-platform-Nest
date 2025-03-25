// Basic class for query params with pagination
// Default values are set automatically in global ValidationPipe in main.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidateIf } from 'class-validator';
import { IsStringWithTrim } from '../decorators/is-not-empty-string';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}
export abstract class BaseSortablePaginationParams<T> {
  @ValidateIf(
    (o: Record<string, string>) => typeof o.pageNumber !== 'undefined',
  )
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNumber: number = 1;

  @ValidateIf((o: Record<string, string>) => typeof o.pageSize !== 'undefined')
  @Min(1)
  @IsInt()
  @Type(() => Number)
  pageSize: number = 10;

  @ValidateIf(
    (o: Record<string, string>) => typeof o.sortDirection !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  abstract sortBy: T;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
