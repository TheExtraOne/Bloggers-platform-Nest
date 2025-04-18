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

  async createSeveralQuestions(count: number): Promise<PGQuestionViewDto[]> {
    const questions = [] as PGQuestionViewDto[];

    for (let i = 0; i < count; ++i) {
      const response = await this.createQuestion({
        body: `Test question ${i}?`,
        correctAnswers: [`Answer ${i}`],
      });
      questions.push(response);
    }

    return questions;
  }
}
