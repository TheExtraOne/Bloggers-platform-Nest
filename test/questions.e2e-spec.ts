import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { QUESTIONS_CONSTRAINTS } from '../src/modules/quiz/questions/domain/question.entity';
import { CreateQuestionInputDto } from '../src/modules/quiz/questions/api/input-dto/create-question.input-dto';
import { QuestionsSortBy } from '../src/modules/quiz/questions/api/input-dto/questions-sort-by';
import { PGQuestionViewDto } from '../src/modules/quiz/questions/api/view-dto/question.view-dto';

describe('Questions Controller (e2e)', () => {
  let app: INestApplication;
  let questionsTestManager: QuestionsTestManager;
  let httpServer: App;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    questionsTestManager = result.questionsTestManager;
    httpServer = result.httpServer;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /sa/quiz/questions - get all questions with filters', () => {
    let questions: PGQuestionViewDto[];

    beforeEach(async () => {
      questions = await questionsTestManager.createTestQuestions();
    });

    it('should return all questions with default pagination (page=1, pageSize=10)', async () => {
      // Add explicit sorting for consistent test results
      const response = await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}?sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      // Check pagination metadata
      expect(response.body).toMatchObject({
        totalCount: 3,
        pagesCount: 1,
        page: 1,
        pageSize: 10
      });

      // Check items array
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items.map(q => q.id)).toEqual([questions[0].id, questions[1].id, questions[2].id]);

      // Check item structure
      response.body.items.forEach(item => {
        expect(item).toEqual(expect.objectContaining({
          id: expect.any(String),
          body: expect.any(String),
          correctAnswers: expect.any(Array),
          published: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }));
      });
    });

    it('should return questions filtered by bodySearchTerm (exact and partial match)', async () => {
      // Search for Question 1
      const searchResponse = await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}?bodySearchTerm=Question%201&sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(searchResponse.body.items).toHaveLength(1);
      expect(searchResponse.body.items[0].id).toBe(questions[0].id);
      expect(searchResponse.body.items[0].body).toBe('Question 1?');

      // Search for all questions
      const allQuestionsResponse = await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}?bodySearchTerm=Question&sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(allQuestionsResponse.body.items).toHaveLength(3);
      expect(allQuestionsResponse.body.items.map(q => q.id)).toEqual([questions[0].id, questions[1].id, questions[2].id]);
    });

    it('should return questions sorted by createdAt in ascending and descending order', async () => {
      // Get questions sorted by createdAt DESC
      const descResponse = await request(httpServer)
        .get(
          `/${PATHS.SA_QUESTIONS}?sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=desc`,
        )
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      const descDates = descResponse.body.items.map((item) =>
        new Date(item.createdAt).getTime(),
      );
      const isSortedDesc = descDates.every(
        (date, i) => i === 0 || date <= descDates[i - 1],
      );
      expect(isSortedDesc).toBe(true);
      expect(descResponse.body.items[0].id).toBe(questions[2].id); // Last created question first

      // Get questions sorted by createdAt ASC
      const ascResponse = await request(httpServer)
        .get(
          `/${PATHS.SA_QUESTIONS}?sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`,
        )
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      const ascDates = ascResponse.body.items.map((item) =>
        new Date(item.createdAt).getTime(),
      );
      const isSortedAsc = ascDates.every(
        (date, i) => i === 0 || date >= ascDates[i - 1],
      );
      expect(isSortedAsc).toBe(true);
      expect(ascResponse.body.items[0].id).toBe(questions[0].id); // First created question first
    });

    it('should handle custom pagination (pageSize=2) correctly across multiple pages', async () => {
      // Get first page with explicit sorting to ensure consistent order
      const firstPageResponse = await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}?pageNumber=1&pageSize=2&sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(firstPageResponse.body).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({ id: questions[0].id }),
          expect.objectContaining({ id: questions[1].id }),
        ]),
        totalCount: 3,
        pagesCount: 2,
        page: 1,
        pageSize: 2,
      });
      expect(firstPageResponse.body.items).toHaveLength(2);

      // Get second page
      const secondPageResponse = await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}?pageNumber=2&pageSize=2&sortBy=${QuestionsSortBy.CreatedAt}&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(secondPageResponse.body).toEqual({
        items: [expect.objectContaining({ id: questions[2].id })],
        totalCount: 3,
        pagesCount: 2,
        page: 2,
        pageSize: 2,
      });
      expect(secondPageResponse.body.items).toHaveLength(1); // Last page with 1 item
    });

    it('should return 401 if unauthorized', async () => {
      await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if wrong credentials', async () => {
      await request(httpServer)
        .get(`/${PATHS.SA_QUESTIONS}`)
        .auth('wrong', 'credentials')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /sa/quiz/questions - create new question', () => {
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
