import { ValidateIf, IsEnum } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentsSortBy } from './comments-sort-by';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class GetCommentsQueryParams extends BaseSortablePaginationParams<CommentsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(CommentsSortBy)
  sortBy = CommentsSortBy.CreatedAt;
}
