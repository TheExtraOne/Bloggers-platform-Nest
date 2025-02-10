// Dto for getting blogs with pagination, sorting and filters
import { BaseSortablePaginationParams } from '../../../dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by';

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  sortBy = PostsSortBy.CreatedAt;
}
