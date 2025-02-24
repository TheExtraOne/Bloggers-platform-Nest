import { IsEnum, ValidateIf } from 'class-validator';
import { UsersSortBy } from './users-sort-by';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetUsersQueryParams extends BaseSortablePaginationParams<UsersSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(UsersSortBy)
  sortBy = UsersSortBy.CreatedAt;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchLoginTerm !== 'undefined' && o.searchLoginTerm !== null,
  )
  @IsStringWithTrim()
  searchLoginTerm: string | null = null;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchEmailTerm !== 'undefined' && o.searchEmailTerm !== null,
  )
  @IsStringWithTrim()
  searchEmailTerm: string | null = null;
}
