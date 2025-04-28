import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, Repository } from 'typeorm';
import { Questions } from '../domain/question.entity';
import { ERRORS, LOCK_MODES } from '../../../../constants';

@Injectable()
export class PgQuestionsRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Questions)
    private readonly questionsRepository: Repository<Questions>,
  ) {
    super();
  }

  async findQuestionByIdOrThrow(
    id: string,
    manager?: EntityManager,
    lockMode?: LOCK_MODES,
  ): Promise<Questions> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }

    const repo = manager?.getRepository(Questions) || this.questionsRepository;
    let qb = repo
      .createQueryBuilder('question')
      .where('question.id = :id', { id: +id });

    if (lockMode) {
      qb = qb.setLock(lockMode);
    }

    const question = await qb.getOne();

    if (!question) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    return question;
  }

  async getRandomQuestions(
    amount: number = 5,
    manager?: EntityManager,
  ): Promise<{ id: string; body: string }[]> {
    // On large tables, ORDER BY RANDOM() can be slow because it assigns a random value to each row and then sorts ALL of them!
    const repo = manager?.getRepository(Questions) || this.questionsRepository;

    const randomQuestions: { id: string; body: string }[] = await repo
      .createQueryBuilder('question')
      .select(['question.id::text AS id', 'question.body AS body'])
      .where('question.published = :published', { published: true })
      .andWhere('question.deletedAt IS NULL')
      .orderBy('RANDOM()')
      .limit(amount)
      .getRawMany();

    return randomQuestions;
  }

  async save(
    newQuestion: Questions,
    manager?: EntityManager,
  ): Promise<Questions> {
    if (manager) {
      return await manager.save(Questions, newQuestion);
    }
    return await this.questionsRepository.save(newQuestion);
  }

  async deleteQuestion(id: string, manager?: EntityManager): Promise<void> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }

    const repo = manager?.getRepository(Questions) || this.questionsRepository;
    const result = await repo.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }
  }
}
