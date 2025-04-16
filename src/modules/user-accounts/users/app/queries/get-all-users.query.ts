import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgUsersQueryRepository } from '../../infrastructure/query/pg.users.query-repository';
import { GetUsersQueryParams } from '../../api/input-dto/get-users.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PGUserViewDto } from '../../api/view-dto/users.view-dto';

export class GetAllUsersQuery extends Query<PaginatedViewDto<PGUserViewDto[]>> {
  constructor(public queryParams: GetUsersQueryParams) {
    super();
  }
}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersQueryHandler
  implements IQueryHandler<GetAllUsersQuery>
{
  constructor(private pgUsersQueryRepository: PgUsersQueryRepository) {}

  async execute(query: GetAllUsersQuery) {
    return this.pgUsersQueryRepository.findAll(query.queryParams);
  }
}
