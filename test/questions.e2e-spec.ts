import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
// import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { QUESTIONS_CONSTRAINTS } from '../src/modules/quiz/questions/domain/question.entity';
import { CreateQuestionInputDto } from '../src/modules/quiz/questions/api/input-dto/create-question.input-dto';

describe('Questions Controller (e2e)', () => {
  let app: INestApplication;
  // let questionsTestManager: QuestionsTestManager;
  let httpServer: App;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    // questionsTestManager = result.questionsTestManager;
    httpServer = result.httpServer;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /sa/quiz/questions', () => {
    const validQuestion: CreateQuestionInputDto = {
      body: 'What is the capital of France?',
      correctAnswers: ['Paris'],
    };

    it('should create question with correct input', async () => {
      const response = await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(validQuestion)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(String),
        body: validQuestion.body,
        correctAnswers: validQuestion.correctAnswers,
        published: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 if unauthorized', async () => {
      await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(validQuestion)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if wrong credentials', async () => {
      await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(validQuestion)
        .auth('wrong', 'credentials')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 if body is too short', async () => {
      const invalidQuestion = {
        ...validQuestion,
        body: 'Short?',
      };

      const response = await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(invalidQuestion)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
          }),
        ]),
      });
    });

    it('should return 400 if body is too long', async () => {
      const invalidQuestion = {
        ...validQuestion,
        body: 'a'.repeat(QUESTIONS_CONSTRAINTS.MAX_QUESTION_LENGTH + 1),
      };

      const response = await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(invalidQuestion)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
          }),
        ]),
      });
    });

    it('should return 400 if correctAnswers is empty', async () => {
      const invalidQuestion = {
        ...validQuestion,
        correctAnswers: [],
      };

      const response = await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(invalidQuestion)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
          }),
        ]),
      });
    });

    it('should return 400 if correctAnswers contains non-string values', async () => {
      const invalidQuestion = {
        ...validQuestion,
        correctAnswers: [123, true],
      };

      const response = await request(httpServer)
        .post(`/${PATHS.SA_QUESTIONS}`)
        .send(invalidQuestion)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
          }),
        ]),
      });
    });
  });
});
