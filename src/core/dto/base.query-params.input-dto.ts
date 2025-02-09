// Basic class for query params with pagination
// Default values are set automatically in global ValidationPipe in main.ts
import { Type } from 'class-transformer';

class PaginationParams {
  // To transform into number
  @Type(() => Number)
  pageNumber: number = 1;
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
  sortDirection: SortDirection = SortDirection.Desc;
  abstract sortBy: T;
}
