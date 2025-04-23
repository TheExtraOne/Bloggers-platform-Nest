import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';

export class GetGameByIdQuery extends Query<PairViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdQueryHandler
  implements IQueryHandler<GetGameByIdQuery>
{
  constructor(private pairGamesQueryRepository: PairGamesQueryRepository) {}

  async execute(query: GetGameByIdQuery) {
    return this.pairGamesQueryRepository.getPairGameByIdOrThrowError(query.id);
  }
}
