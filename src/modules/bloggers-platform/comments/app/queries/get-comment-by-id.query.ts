import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgCommentsQueryRepository } from '../../infrastructure/query/pg.comments.query-repository';
import { PgCommentsViewDto } from '../../api/view-dto/comment.view-dto';

export class GetCommentByIdQuery extends Query<PgCommentsViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdQueryHandler
  implements IQueryHandler<GetCommentByIdQuery>
{
  constructor(private pgCommentsQueryRepository: PgCommentsQueryRepository) {}

  async execute(query: GetCommentByIdQuery) {
    return this.pgCommentsQueryRepository.findCommentById(query.id);
  }
}
