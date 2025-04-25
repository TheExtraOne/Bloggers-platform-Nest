import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';
import { AnswerQueryRepository } from '../../infrastructure/query/answer.query.repository';

export class GetAnswerByIdQuery extends Query<AnswerViewDto> {
  constructor(public id: string) {
    super();
  }
}

@QueryHandler(GetAnswerByIdQuery)
export class GetAnswerByIdQueryHandler
  implements IQueryHandler<GetAnswerByIdQuery>
{
  constructor(private answerQueryRepository: AnswerQueryRepository) {}

  async execute(query: GetAnswerByIdQuery) {
    return this.answerQueryRepository.getAnswerByIdOrThrowError(query.id);
  }
}
