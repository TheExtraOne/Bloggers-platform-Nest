import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
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

  async findQuestionByIdOrThrow(id: string): Promise<Questions> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }

    const question = await this.questionsRepository.findOneBy({
      id: +id,
    });
    if (!question) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);

    return question;
  }

  async getRandomQuestions(
    amount: number = 5,
  ): Promise<{ id: string; body: string }[]> {
    // On large tables, ORDER BY RANDOM() can be slow because it assigns a random value to each row and then sorts ALL of them!
    const randomQuestions = await this.questionsRepository
      .createQueryBuilder('question')
      .select(['question.id::text AS id', 'question.body AS body'])
      .where('question.published = :published', { published: true })
      .andWhere('question.deletedAt IS NULL')
      .orderBy('RANDOM()')
      .limit(amount)
      .getRawMany();

    return randomQuestions as unknown as { id: string; body: string }[];
  }

  async createQuestion(dto: {
    body: string;
    correctAnswers: string[];
  }): Promise<{ questionId: string }> {
    const { body, correctAnswers } = dto;

    const newQuestion = new Questions();
    newQuestion.body = body;
    newQuestion.correctAnswers = correctAnswers;
    await this.questionsRepository.save(newQuestion);

    return { questionId: newQuestion.id.toString() };
  }

  async updateQuestion(
    id: string,
    dto: {
      body: string;
      correctAnswers: string[];
    },
  ): Promise<void> {
    const { body, correctAnswers } = dto;

    const question = await this.findQuestionByIdOrThrow(id);

    question.body = body;
    question.correctAnswers = correctAnswers;
    await this.questionsRepository.save(question);
  }

  async publishQuestion(id: string, isPublished: boolean): Promise<void> {
    const question = await this.findQuestionByIdOrThrow(id);
    question.published = isPublished;
    await this.questionsRepository.save(question);
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }

    const result = await this.questionsRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
    }
  }
}
