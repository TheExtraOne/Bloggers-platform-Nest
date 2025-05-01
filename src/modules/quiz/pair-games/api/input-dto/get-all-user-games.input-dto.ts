import { IsEnum, ValidateIf } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { GamesSortBy } from './games-sort-by';

export class GetAllUserGamesQueryParams extends BaseSortablePaginationParams<GamesSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(GamesSortBy)
  sortBy = GamesSortBy.PairCreatedDate;
}
