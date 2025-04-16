import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgCommentsQueryRepository } from '../../infrastructure/query/pg.comments.query-repository';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgCommentsViewDto } from '../../api/view-dto/comment.view-dto';

export class GetAllCommentsForPostQuery extends Query<
  PaginatedViewDto<PgCommentsViewDto[]>
> {
  constructor(
    public postId: string,
    public queryParams: GetCommentsQueryParams,
  ) {
    super();
  }
}

@QueryHandler(GetAllCommentsForPostQuery)
export class GetAllCommentsForPostQueryHandler
  implements IQueryHandler<GetAllCommentsForPostQuery>
{
  constructor(private pgCommentsQueryRepository: PgCommentsQueryRepository) {}

  async execute(query: GetAllCommentsForPostQuery) {
    return this.pgCommentsQueryRepository.findAllCommentsForPostId(
      query.postId,
      query.queryParams,
    );
  }
}
