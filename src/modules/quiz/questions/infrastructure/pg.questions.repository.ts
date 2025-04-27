import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, Repository } from 'typeorm';
import { Questions } from '../domain/question.entity';
import { ERRORS } from '../../../../constants';

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
  ): Promise<Questions> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }

    const repo = manager?.getRepository(Questions) || this.questionsRepository;
    const question = await repo.findOneBy({ id: +id });

    if (!question) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    return question;
  }

  async getRandomQuestions(
    amount: number = 5,
    manager?: EntityManager,
  ): Promise<{ id: string; body: string }[]> {
    // On large tables, ORDER BY RANDOM() can be slow because it assigns a random value to each row and then sorts ALL of them!
    const repo = manager?.getRepository(Questions) || this.questionsRepository;

    const randomQuestions = await repo
      .createQueryBuilder('question')
      .select(['question.id::text AS id', 'question.body AS body'])
      .where('question.published = :published', { published: true })
      .andWhere('question.deletedAt IS NULL')
      .orderBy('RANDOM()')
      .limit(amount)
      .getRawMany();

    return randomQuestions as unknown as { id: string; body: string }[];
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
  // TODO: add lock, move to use case and transaction
  async updateQuestion(
    id: string,
    dto: {
      body: string;
      correctAnswers: string[];
    },
    manager?: EntityManager,
  ): Promise<void> {
    const { body, correctAnswers } = dto;

    const question = await this.findQuestionByIdOrThrow(id, manager);

    question.body = body;
    question.correctAnswers = correctAnswers;
    await this.save(question, manager);
  }

  // TODO: add lock, move to use case and transaction
  async publishQuestion(
    id: string,
    isPublished: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const question = await this.findQuestionByIdOrThrow(id, manager);
    question.published = isPublished;
    await this.save(question, manager);
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
