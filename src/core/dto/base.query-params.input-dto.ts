// Basic class for query params with pagination
// Default values are set automatically in global ValidationPipe in main.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidateIf } from 'class-validator';
import { IsStringWithTrim } from '../decorators/is-not-empty-string';

class PaginationParams {
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

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

// Basic class for query params with sorting and pagination
// sortBy field should be implemented in children classes
export abstract class BaseSortablePaginationParams<T> extends PaginationParams {
  @ValidateIf(
    (o: Record<string, string>) => typeof o.sortDirection !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  abstract sortBy: T;
}
