import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';
import { PairGameService } from '../pair-game.service';
import { ForbiddenException } from '@nestjs/common';

export class GetGameByIdQuery extends Query<PairViewDto> {
  constructor(
    public gameId: string,
    public userId: string,
  ) {
    super();
  }
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdQueryHandler
  implements IQueryHandler<GetGameByIdQuery>
{
  constructor(
    private pairGamesQueryRepository: PairGamesQueryRepository,
    private pairGameService: PairGameService,
  ) {}

  async execute(query: GetGameByIdQuery) {
    const pairGame =
      await this.pairGamesQueryRepository.getPairGameByIdOrThrowError(
        query.gameId,
      );
    const isUserParticipatingInTheGame =
      this.pairGameService.userIsParticipatingInTheGame(query.userId, pairGame);
    if (!isUserParticipatingInTheGame) throw new ForbiddenException();

    return pairGame;
  }
}
