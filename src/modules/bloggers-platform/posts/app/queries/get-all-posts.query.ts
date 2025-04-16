import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgPostsQueryRepository } from '../../infrastructure/query/pg.posts.query-repository';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgPostsViewDto } from '../../api/view-dto/posts.view-dto';

export class GetAllPostsQuery extends Query<PaginatedViewDto<PgPostsViewDto[]>> {
  constructor(public queryParams: GetPostsQueryParams) {
    super();
  }
}

@QueryHandler(GetAllPostsQuery)
export class GetAllPostsQueryHandler
  implements IQueryHandler<GetAllPostsQuery>
{
  constructor(private pgPostsQueryRepository: PgPostsQueryRepository) {}

  async execute(query: GetAllPostsQuery) {
    return this.pgPostsQueryRepository.findAllPosts(query.queryParams);
  }
}
