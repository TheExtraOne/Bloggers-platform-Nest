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

  async updateQuestion(
    id: string,
    updateDto: {
      body: string;
      correctAnswers: string[];
    },
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.SA_QUESTIONS}/${id}`)
      .auth('admin', 'qwerty')
      .send(updateDto)
      .expect(statusCode);
  }

  async updateQuestionInvalid(
    id: string,
    invalidDto: any,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.SA_QUESTIONS}/${id}`)
      .auth('admin', 'qwerty')
      .send(invalidDto)
      .expect(statusCode);
  }

  async updateQuestionUnauthorized(
    id: string,
    updateDto: {
      body: string;
      correctAnswers: string[];
    },
    username?: string,
    password?: string,
  ) {
    const request = this.app.getHttpServer();
    if (username && password) {
      await supertest(request)
        .put(`/${PATHS.SA_QUESTIONS}/${id}`)
        .auth(username, password)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    } else {
      await supertest(request)
        .put(`/${PATHS.SA_QUESTIONS}/${id}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    }
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

  // Reusable test data
  private readonly testQuestions = [
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

  async createTestQuestions() {
    return Promise.all(
      this.testQuestions.map((question) => this.createQuestion(question)),
    );
  }

  // Helper method to create and publish a question in one step
  async createAndPublishQuestion(
    createModel: CreateQuestionInputDto,
    published: boolean = true,
  ): Promise<PGQuestionViewDto> {
    const question = await this.createQuestion(createModel);
    if (published) {
      await this.publishQuestion(question.id, true);
    }
    return question;
  }

  // Helper method to perform bulk operations
  async bulkCreateQuestions(count: number): Promise<PGQuestionViewDto[]> {
    const questions = Array.from({ length: count }, (_, i) => ({
      body: `Test Question ${i + 1}?`,
      correctAnswers: [`Answer ${i + 1}`],
    }));
    return Promise.all(questions.map((q) => this.createQuestion(q)));
  }
}
