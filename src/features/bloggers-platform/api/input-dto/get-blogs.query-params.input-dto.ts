import { ValidateIf, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../core/dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs-sort-by';
import { Transform } from 'class-transformer';

export class GetBlogsQueryParams extends BaseSortablePaginationParams<BlogsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  @IsIn(Object.values(BlogsSortBy))
  sortBy = BlogsSortBy.CreatedAt;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.searchNameTerm !== 'undefined' && o.searchNameTerm !== null,
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  searchNameTerm: string | null = null;
}
