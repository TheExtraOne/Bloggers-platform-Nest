import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgPostsQueryRepository } from '../../infrastructure/query/pg.posts.query-repository';
import { PgPostsViewDto } from '../../api/view-dto/posts.view-dto';

export class GetPostByIdQuery extends Query<PgPostsViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdQueryHandler implements IQueryHandler<GetPostByIdQuery> {
  constructor(private pgPostsQueryRepository: PgPostsQueryRepository) {}

  async execute(query: GetPostByIdQuery) {
    return this.pgPostsQueryRepository.findPostById(query.id);
  }
}
