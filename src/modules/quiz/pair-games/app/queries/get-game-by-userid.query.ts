import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';

export class GetActiveGameByUserIdQuery extends Query<PairViewDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetActiveGameByUserIdQuery)
export class GetActiveGameByUserIdQueryHandler
  implements IQueryHandler<GetActiveGameByUserIdQuery>
{
  constructor(private pairGamesQueryRepository: PairGamesQueryRepository) {}

  async execute(query: GetActiveGameByUserIdQuery) {
    return this.pairGamesQueryRepository.getActivePairGameByUserIdOrThrowError(
      query.userId,
    );
  }
}
