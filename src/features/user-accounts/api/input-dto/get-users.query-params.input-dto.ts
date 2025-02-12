import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';
import { Transform } from 'class-transformer';

export class GetUsersQueryParams extends BaseSortablePaginationParams<UsersSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @IsIn(Object.values(UsersSortBy))
  sortBy = UsersSortBy.CreatedAt;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchLoginTerm !== 'undefined' && o.searchLoginTerm !== null,
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  searchLoginTerm: string | null = null;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchEmailTerm !== 'undefined' && o.searchEmailTerm !== null,
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  searchEmailTerm: string | null = null;
}
