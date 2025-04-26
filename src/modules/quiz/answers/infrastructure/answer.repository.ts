import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, Repository } from 'typeorm';
import { Answers } from '../domain/answers.entity';

@Injectable()
export class AnswerRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Answers)
    private readonly answerRepository: Repository<Answers>,
  ) {
    super();
  }

  async save(answer: Answers, manager?: EntityManager): Promise<Answers> {
    if (manager) {
      return await manager.save(Answers, answer);
    }
    return await this.answerRepository.save(answer);
  }
}
