import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgSessionsQueryRepository } from '../../infrastructure/query/pg.sessions.query-repository';
import { PgSessionsViewDto } from '../../api/view-dto/sessions.view-dto';

export class GetAllSessionsQuery extends Query<PgSessionsViewDto[]> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetAllSessionsQuery)
export class GetAllSessionsQueryHandler
  implements IQueryHandler<GetAllSessionsQuery>
{
  constructor(private pgSessionsQueryRepository: PgSessionsQueryRepository) {}

  async execute(query: GetAllSessionsQuery) {
    return this.pgSessionsQueryRepository.findAllSessionsByUserId(query.userId);
  }
}
