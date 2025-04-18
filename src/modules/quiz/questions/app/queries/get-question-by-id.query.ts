import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgQuestionsQueryRepository } from '../../infrastructure/query/pg.questions.query-repository';
import { PGQuestionViewDto } from '../../api/view-dto/question.view-dto';

export class GetQuestionByIdQuery extends Query<PGQuestionViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetQuestionByIdQuery)
export class GetQuestionByIdQueryHandler
  implements IQueryHandler<GetQuestionByIdQuery>
{
  constructor(private pgQuestionsQueryRepository: PgQuestionsQueryRepository) {}

  async execute(query: GetQuestionByIdQuery) {
    return this.pgQuestionsQueryRepository.getQuestionById(query.id);
  }
}
