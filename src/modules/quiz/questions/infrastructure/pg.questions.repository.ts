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

  // TODO?
  // async findQuestionByIdOrThrow(id: string): Promise<Questions> {
  //   if (!this.isCorrectNumber(id)) {
  //     throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);
  //   }

  //   const question = await this.questionsRepository.findOneBy({
  //     id: +id,
  //   });
  //   if (!question) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);

  //   return question;
  // }

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
  // TODO: remove
  // async checkBlogExists(id: string): Promise<boolean> {
  //   if (!this.isCorrectNumber(id)) {
  //     return false;
  //   }
  //   const exists = await this.blogsRepository.exists({
  //     where: {
  //       id: +id,
  //     },
  //   });

  //   return exists;
  // }
  // TODO: remove
  // async updateBlog(
  //   id: string,
  //   dto: {
  //     name: string;
  //     description: string;
  //     websiteUrl: string;
  //   },
  // ): Promise<void> {
  //   const { name, description, websiteUrl } = dto;

  //   const blog = await this.findBlogByIdOrThrow(id);

  //   blog.name = name;
  //   blog.description = description;
  //   blog.websiteUrl = websiteUrl;

  //   await this.blogsRepository.save(blog);
  // }

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
