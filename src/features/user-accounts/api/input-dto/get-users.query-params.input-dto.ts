// Dto for getting users with pagination, sorting and filters
import { BaseSortablePaginationParams } from '../../../dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';

export class GetUsersQueryParams extends BaseSortablePaginationParams<UsersSortBy> {
  sortBy = UsersSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}
