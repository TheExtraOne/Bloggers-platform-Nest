import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';
import { UserStatisticViewDto } from '../../api/view-dto/user-statistic.view-dto';

export class GetUserStatisticQuery extends Query<UserStatisticViewDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetUserStatisticQuery)
export class GetUserStatisticQueryHandler
  implements IQueryHandler<GetUserStatisticQuery>
{
  constructor(private pairGamesQueryRepository: PairGamesQueryRepository) {}

  async execute(query: GetUserStatisticQuery) {
    return this.pairGamesQueryRepository.getUserStatistic(query.userId);
  }
}
