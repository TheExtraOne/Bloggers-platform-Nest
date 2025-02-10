// Dto for getting blogs with pagination, sorting and filters
import { BaseSortablePaginationParams } from '../../../dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs-sort-by';

export class GetBlogsQueryParams extends BaseSortablePaginationParams<BlogsSortBy> {
  sortBy = BlogsSortBy.CreatedAt;
  searchNameTerm: string | null = null;
}
