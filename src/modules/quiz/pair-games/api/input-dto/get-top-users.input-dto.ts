import { IsInt, Min, ValidateIf } from 'class-validator';
import { TopUsersSort } from './top-users-sort';
import { Transform, Type } from 'class-transformer';
import { IsSortFieldAndDirection } from './top-users-decorator';

export class GetTopUsersQueryParams {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsSortFieldAndDirection(Object.values(TopUsersSort), {
    message:
      'Sort must be of format "fieldName direction", for example: avgScores desc',
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  sort: string[] = [
    `${TopUsersSort.AvgScores} desc`,
    `${TopUsersSort.SumScore} desc`,
  ];

  @ValidateIf(
    (o: Record<string, string>) => typeof o.pageNumber !== 'undefined',
  )
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNumber: number = 1;

  @ValidateIf((o: Record<string, string>) => typeof o.pageSize !== 'undefined')
  @Min(1)
  @IsInt()
  @Type(() => Number)
  pageSize: number = 10;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
