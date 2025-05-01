import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetAllUserGamesQueryParams } from '../../api/input-dto/get-all-user-games.input-dto';

export class GetAllGamesByUserIdQuery extends Query<
  PaginatedViewDto<PairViewDto[]>
> {
  constructor(
    public userId: string,
    public query: GetAllUserGamesQueryParams,
  ) {
    super();
  }
}

@QueryHandler(GetAllGamesByUserIdQuery)
export class GetAllGamesByUserIdQueryHandler
  implements IQueryHandler<GetAllGamesByUserIdQuery>
{
  constructor(private pairGamesQueryRepository: PairGamesQueryRepository) {}

  async execute(query: GetAllGamesByUserIdQuery) {
    return this.pairGamesQueryRepository.getAllGamesByUserId(
      query.userId,
      query.query,
    );
  }
}
