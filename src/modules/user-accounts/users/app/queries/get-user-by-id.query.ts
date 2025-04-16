import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgUsersQueryRepository } from '../../infrastructure/query/pg.users.query-repository';
import { PGUserViewDto } from '../../api/view-dto/users.view-dto';

export class GetUserByIdQuery extends Query<PGUserViewDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private pgUsersQueryRepository: PgUsersQueryRepository) {}

  async execute(query: GetUserByIdQuery) {
    return this.pgUsersQueryRepository.findUserById(query.userId);
  }
}
