import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { Answers } from '../domain/answers.entity';

@Injectable()
export class AnswerRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Answers)
    private readonly answerRepository: Repository<Answers>,
  ) {
    super();
  }

  async save(answer: Answers): Promise<Answers> {
    return await this.answerRepository.save(answer);
  }
}
