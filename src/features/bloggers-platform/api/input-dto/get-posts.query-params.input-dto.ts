import { ValidateIf, IsEnum } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../core/dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by';
import { IsStringWithTrim } from '../../../../core/decorators/is-not-empty-string';

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(PostsSortBy)
  sortBy = PostsSortBy.CreatedAt;
}
