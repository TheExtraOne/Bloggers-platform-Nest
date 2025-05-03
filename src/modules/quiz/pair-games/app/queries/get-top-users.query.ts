import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PairGamesQueryRepository } from '../../infrastructure/query/pair-games.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetTopUsersQueryParams } from '../../api/input-dto/get-top-users.input-dto';
import { TopUserViewDto } from '../../api/view-dto/top-user.view-dto';

export class GetTopUsersQuery extends Query<
  PaginatedViewDto<TopUserViewDto[]>
> {
  constructor(public query: GetTopUsersQueryParams) {
    super();
  }
}

@QueryHandler(GetTopUsersQuery)
export class GetTopUsersQueryHandler
  implements IQueryHandler<GetTopUsersQuery>
{
  constructor(private pairGamesQueryRepository: PairGamesQueryRepository) {}

  async execute(query: GetTopUsersQuery) {
    return this.pairGamesQueryRepository.getTopUsers(query.query);
  }
}
