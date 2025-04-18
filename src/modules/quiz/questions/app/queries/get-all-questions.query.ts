import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PgQuestionsQueryRepository } from '../../infrastructure/query/pg.questions.query-repository';
import { GetQuestionsQueryParams } from '../../api/input-dto/get-questions.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PGQuestionViewDto } from '../../api/view-dto/question.view-dto';

export class GetAllQuestionsQuery extends Query<
  PaginatedViewDto<PGQuestionViewDto[]>
> {
  constructor(public queryParams: GetQuestionsQueryParams) {
    super();
  }
}

@QueryHandler(GetAllQuestionsQuery)
export class GetAllQuestionsQueryHandler
  implements IQueryHandler<GetAllQuestionsQuery>
{
  constructor(private pgQuestionsQueryRepository: PgQuestionsQueryRepository) {}

  async execute(query: GetAllQuestionsQuery) {
    return this.pgQuestionsQueryRepository.findAll(query.queryParams);
  }
}
