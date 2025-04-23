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
    // const randomQuestions = await this.questionsRepository
    // .createQueryBuilder('question')
    // .where('question.published = :published', { published: true })
    // .andWhere('question.deletedAt IS NULL')
    // .orderBy('RANDOM()')
    // .limit(amount)
    // .getMany();

    const ids: { id: number }[] = await this.questionsRepository
      .createQueryBuilder('questions')
      .select(['questions.id AS id'])
      .where('questions.published = :published', { published: true })
      .andWhere('questions.deletedAt IS NULL')
      .getRawMany();

    // const pickedIds = ids
    //   .map((r) => r.id)
    //   .sort(() => 0.5 - Math.random())
    //   .slice(0, amount);

    const randomIndices = this.getRandomIndices(ids.length, amount);
    const pickedIds = randomIndices.map((i) => ids[i].id);

    const randomQuestions: { id: string; body: string }[] =
      await this.questionsRepository
        .createQueryBuilder('questions')
        .select(['questions.id::text AS id', 'questions.body AS body'])
        .where('questions.id IN (:...ids)', { ids: pickedIds })
        .getRawMany();

    return randomQuestions;
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

  private getRandomIndices(arrLength: number, n: number): number[] {
    const indices = new Set<number>();
    while (indices.size < Math.min(n, arrLength)) {
      indices.add(Math.floor(Math.random() * arrLength));
    }
    return Array.from(indices);
  }
}
