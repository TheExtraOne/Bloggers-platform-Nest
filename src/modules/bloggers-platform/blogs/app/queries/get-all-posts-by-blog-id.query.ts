import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgPostsQueryRepository } from '../../../posts/infrastructure/query/pg.posts.query-repository';
import { GetPostsQueryParams } from '../../../posts/api/input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgPostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';

export class GetAllPostsByBlogIdQuery extends Query<
  PaginatedViewDto<PgPostsViewDto[]>
> {
  constructor(
    public id: string,
    public queryParams: GetPostsQueryParams,
  ) {
    super();
  }
}

@QueryHandler(GetAllPostsByBlogIdQuery)
export class GetAllPostsByBlogIdQueryHandler
  implements IQueryHandler<GetAllPostsByBlogIdQuery>
{
  constructor(private pgPostsQueryRepository: PgPostsQueryRepository) {}

  async execute(query: GetAllPostsByBlogIdQuery) {
    return this.pgPostsQueryRepository.findAllPostsForBlogId(
      query.id,
      query.queryParams,
    );
  }
}
