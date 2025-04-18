import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { Questions } from '../domain/question.entity';

@Injectable()
export class PgQuestionsRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Questions)
    private readonly questionsRepository: Repository<Questions>,
  ) {
    super();
  }
  // TODO: remove
  // async findBlogByIdOrThrow(id: string): Promise<Blogs> {
  //   if (!this.isCorrectNumber(id)) {
  //     throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
  //   }

  //   const blog = await this.blogsRepository.findOneBy({
  //     id: +id,
  //   });
  //   if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

  //   return blog;
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

  // async deleteBlog(id: string): Promise<void> {
  //   if (!this.isCorrectNumber(id)) {
  //     throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
  //   }

  //   const result = await this.blogsRepository.softDelete(id);

  //   // `result[affected]` contains the number of affected rows.
  //   if (result.affected === 0) {
  //     throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
  //   }
  // }
}
