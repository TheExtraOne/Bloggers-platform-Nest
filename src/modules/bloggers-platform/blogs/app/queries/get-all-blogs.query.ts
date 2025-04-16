import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgBlogsQueryRepository } from '../../infrastructure/query/pg.blogs.query-repository';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgBlogsViewDto } from '../../api/view-dto/blogs.view-dto';

export class GetAllBlogsQuery extends Query<
  PaginatedViewDto<PgBlogsViewDto[]>
> {
  constructor(public queryParams: GetBlogsQueryParams) {
    super();
  }
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsQueryHandler
  implements IQueryHandler<GetAllBlogsQuery>
{
  constructor(private pgBlogsQueryRepository: PgBlogsQueryRepository) {}

  async execute(query: GetAllBlogsQuery) {
    return this.pgBlogsQueryRepository.findAll(query.queryParams);
  }
}
