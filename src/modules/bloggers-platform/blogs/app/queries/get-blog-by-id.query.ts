import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgBlogsQueryRepository } from '../../infrastructure/query/pg.blogs.query-repository';
import { PgBlogsViewDto } from '../../api/view-dto/blogs.view-dto';

export class GetBlogByIdQuery extends Query<PgBlogsViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler
  implements IQueryHandler<GetBlogByIdQuery>
{
  constructor(private pgBlogsQueryRepository: PgBlogsQueryRepository) {}

  async execute(query: GetBlogByIdQuery) {
    return this.pgBlogsQueryRepository.getBlogById(query.id);
  }
}
