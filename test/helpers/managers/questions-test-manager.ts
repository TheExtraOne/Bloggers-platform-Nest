import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { CreateQuestionInputDto } from '../../../src/modules/quiz/questions/api/input-dto/create-question.input-dto';
import { PGQuestionViewDto } from '../../../src/modules/quiz/questions/api/view-dto/question.view-dto';

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
