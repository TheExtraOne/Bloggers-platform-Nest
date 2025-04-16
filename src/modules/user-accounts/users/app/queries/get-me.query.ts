import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgUsersQueryRepository } from '../../infrastructure/query/pg.users.query-repository';
import { PGMeViewDto } from '../../api/view-dto/users.view-dto';

export class GetMeQuery extends Query<PGMeViewDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery> {
  constructor(private pgUsersQueryRepository: PgUsersQueryRepository) {}

  async execute(query: GetMeQuery) {
    return this.pgUsersQueryRepository.findMe(query.userId);
  }
}
