import { ValidateIf, IsEnum } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs-sort-by';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class GetBlogsQueryParams extends BaseSortablePaginationParams<BlogsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(BlogsSortBy)
  sortBy = BlogsSortBy.CreatedAt;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchNameTerm !== 'undefined' && o.searchNameTerm !== null,
  )
  @IsStringWithTrim()
  searchNameTerm: string | null = null;
}
