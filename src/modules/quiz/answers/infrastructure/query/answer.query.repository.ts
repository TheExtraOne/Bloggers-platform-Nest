import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { Answers } from '../../domain/answers.entity';
import { ERRORS } from '../../../../../constants';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';

@Injectable()
export class AnswerQueryRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Answers)
    private readonly answerRepository: Repository<Answers>,
  ) {
    super();
  }

  async getAnswerByIdOrThrowError(id: string): Promise<AnswerViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }
    const answer: AnswerViewDto | undefined = await this.answerRepository
      .createQueryBuilder('answer')
      .select([
        'answer.question_id::text AS "questionId"',
        'answer.answer_status AS "answerStatus"',
        'answer.created_at AS "addedAt"',
      ])
      .where('answer.id = :id AND answer.deletedAt IS NULL', { id: +id })
      .getRawOne();

    if (!answer) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);

    return answer;
  }
}
