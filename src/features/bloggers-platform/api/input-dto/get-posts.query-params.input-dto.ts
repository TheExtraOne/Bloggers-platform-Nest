import { ValidateIf, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { BaseSortablePaginationParams } from '../../../../core/dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by';
import { Transform } from 'class-transformer';

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  @IsIn(Object.values(PostsSortBy))
  sortBy = PostsSortBy.CreatedAt;
}
