import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { CreateQuestionInputDto } from '../../../src/modules/quiz/questions/api/input-dto/create-question.input-dto';
import { PGQuestionViewDto } from '../../../src/modules/quiz/questions/api/view-dto/question.view-dto';
import supertest from 'supertest';
import { QuestionsSortBy } from '../../../src/modules/quiz/questions/api/input-dto/questions-sort-by';

export class QuestionsTestManager {
  constructor(private app: INestApplication) {}

  async createQuestion(
    createModel: CreateQuestionInputDto,
    statusCode: HttpStatus = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<PGQuestionViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.SA_QUESTIONS}`)
      .send(createModel)
      .auth(username, password)
      .expect(statusCode);

    return response.body;
  }

  async getPaginatedQuestions(
    pageNumber: number,
    pageSize: number,
    sortBy = QuestionsSortBy.CreatedAt,
    sortDirection: 'asc' | 'desc' = 'asc',
  ) {
    const response = await request(this.app.getHttpServer())
      .get(
        `/${PATHS.SA_QUESTIONS}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
      )
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    return response.body;
  }

  async getSortedQuestions(
    sortBy: QuestionsSortBy,
    sortDirection: 'asc' | 'desc',
  ) {
    const response = await request(this.app.getHttpServer())
      .get(
        `/${PATHS.SA_QUESTIONS}?sortBy=${sortBy}&sortDirection=${sortDirection}`,
      )
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    return response.body;
  }

  async searchQuestions(
    bodySearchTerm: string,
    sortBy = QuestionsSortBy.CreatedAt,
    sortDirection = 'asc',
  ) {
    const response = await request(this.app.getHttpServer())
      .get(
        `/${PATHS.SA_QUESTIONS}?bodySearchTerm=${encodeURIComponent(bodySearchTerm)}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
      )
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    return response.body;
  }

  async getAllQuestions(
    sortBy = QuestionsSortBy.CreatedAt,
    sortDirection = 'asc',
  ) {
    const response = await request(this.app.getHttpServer())
      .get(
        `/${PATHS.SA_QUESTIONS}?sortBy=${sortBy}&sortDirection=${sortDirection}`,
      )
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    return response.body;
  }

  async deleteQuestionUnauthorized(
    id: string,
    username?: string,
    password?: string,
  ) {
    const request = this.app.getHttpServer();
    if (username && password) {
      await supertest(request)
        .delete(`/${PATHS.SA_QUESTIONS}/${id}`)
        .auth(username, password)
        .expect(HttpStatus.UNAUTHORIZED);
    } else {
      await supertest(request)
        .delete(`/${PATHS.SA_QUESTIONS}/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    }
  }

  async publishQuestion(
    id: string,
    published: boolean,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.SA_QUESTIONS}/${id}/publish`)
      .auth('admin', 'qwerty')
      .send({ published })
      .expect(statusCode);
  }

  async publishQuestionInvalid(
    id: string,
    invalidBody: any,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.SA_QUESTIONS}/${id}/publish`)
      .auth('admin', 'qwerty')
      .send(invalidBody)
      .expect(statusCode);
  }

  async publishQuestionUnauthorized(
    id: string,
    published: boolean,
    username?: string,
    password?: string,
  ) {
    const request = this.app.getHttpServer();
    if (username && password) {
      await supertest(request)
        .put(`/${PATHS.SA_QUESTIONS}/${id}/publish`)
        .auth(username, password)
        .send({ published })
        .expect(HttpStatus.UNAUTHORIZED);
    } else {
      await supertest(request)
        .put(`/${PATHS.SA_QUESTIONS}/${id}/publish`)
        .send({ published })
        .expect(HttpStatus.UNAUTHORIZED);
    }
  }

  async deleteQuestion(
    id: string,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.SA_QUESTIONS}/${id}`)
      .auth('admin', 'qwerty')
      .expect(statusCode);
  }

  async getQuestionById(id: string, statusCode: HttpStatus = HttpStatus.OK) {
    const { items } = await this.getAllQuestions();
    const question = items.find(q => q.id === id);
    
    if (!question && statusCode === HttpStatus.NOT_FOUND) {
      return;
    }
    
    if (!question) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    return question;
  }

  async createTestQuestions() {
    const questions = [
      {
        body: 'Question 1?',
        correctAnswers: ['Answer 1'],
      },
      {
        body: 'Question 2?',
        correctAnswers: ['Answer 2'],
      },
      {
        body: 'Question 3?',
        correctAnswers: ['Answer 3'],
      },
    ];

    const createdQuestions: PGQuestionViewDto[] = [];
    for (const question of questions) {
      const response = await this.createQuestion(question);
      createdQuestions.push(response);
    }

    return createdQuestions;
  }
}
