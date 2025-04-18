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
      const response = await questionsTestManager.getAllQuestions();

      // Check pagination metadata
      expect(response).toMatchObject({
        totalCount: 3,
        pagesCount: 1,
        page: 1,
        pageSize: 10
      });

      // Check items array
      expect(response.items).toHaveLength(3);
      expect(response.items.map(q => q.id)).toEqual([questions[0].id, questions[1].id, questions[2].id]);

      // Check item structure
      response.items.forEach(item => {
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
      const searchResponse = await questionsTestManager.searchQuestions('Question 1');

      expect(searchResponse.items).toHaveLength(1);
      expect(searchResponse.items[0].id).toBe(questions[0].id);
      expect(searchResponse.items[0].body).toBe('Question 1?');

      // Search for all questions
      const allQuestionsResponse = await questionsTestManager.getAllQuestions();

      expect(allQuestionsResponse.items).toHaveLength(3);
      expect(allQuestionsResponse.items.map(q => q.id)).toEqual([questions[0].id, questions[1].id, questions[2].id]);
    });

    it('should return questions sorted by createdAt in ascending and descending order', async () => {
      // Get questions sorted by createdAt DESC
      const descResponse = await questionsTestManager.getSortedQuestions(QuestionsSortBy.CreatedAt, 'desc');

      const descDates = descResponse.items.map((item) =>
        new Date(item.createdAt).getTime(),
      );
      const isSortedDesc = descDates.every(
        (date, i) => i === 0 || date <= descDates[i - 1],
      );
      expect(isSortedDesc).toBe(true);
      expect(descResponse.items[0].id).toBe(questions[2].id); // Last created question first

      // Get questions sorted by createdAt ASC
      const ascResponse = await questionsTestManager.getSortedQuestions(QuestionsSortBy.CreatedAt, 'asc');

      const ascDates = ascResponse.items.map((item) =>
        new Date(item.createdAt).getTime(),
      );
      const isSortedAsc = ascDates.every(
        (date, i) => i === 0 || date >= ascDates[i - 1],
      );
      expect(isSortedAsc).toBe(true);
      expect(ascResponse.items[0].id).toBe(questions[0].id); // First created question first
    });

    it('should handle custom pagination (pageSize=2) correctly across multiple pages', async () => {
      // Get first page with explicit sorting to ensure consistent order
      const firstPageResponse = await questionsTestManager.getPaginatedQuestions(1, 2);

      expect(firstPageResponse).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({ id: questions[0].id }),
          expect.objectContaining({ id: questions[1].id }),
        ]),
        totalCount: 3,
        pagesCount: 2,
        page: 1,
        pageSize: 2,
      });
      expect(firstPageResponse.items).toHaveLength(2);

      // Get second page
      const secondPageResponse = await questionsTestManager.getPaginatedQuestions(2, 2);

      expect(secondPageResponse).toEqual({
        items: [expect.objectContaining({ id: questions[2].id })],
        totalCount: 3,
        pagesCount: 2,
        page: 2,
        pageSize: 2,
      });
      expect(secondPageResponse.items).toHaveLength(1); // Last page with 1 item
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

  describe('DELETE /sa/quiz/questions/:id - delete question', () => {
    let questionId: string;

    beforeEach(async () => {
      const question = await questionsTestManager.createQuestion({
        body: 'Test question to delete?',
        correctAnswers: ['Test answer'],
      });
      questionId = question.id;
    });

    it('should delete existing question', async () => {
      // Get all questions before delete
      const { items: beforeItems } = await questionsTestManager.getAllQuestions();
      expect(beforeItems.map(q => q.id)).toContain(questionId);

      // Delete the question
      await questionsTestManager.deleteQuestion(questionId);

      // Verify question returns 404
      await questionsTestManager.getQuestionById(questionId, HttpStatus.NOT_FOUND);

      // Verify question doesn't appear in the list
      const { items: afterItems } = await questionsTestManager.getAllQuestions();
      expect(afterItems.map(q => q.id)).not.toContain(questionId);
    });

    it('should return 404 if question not found', async () => {
      const nonExistentId = '999999';
      await questionsTestManager.deleteQuestion(nonExistentId, HttpStatus.NOT_FOUND);
    });

    it('should return 401 if unauthorized', async () => {
      await questionsTestManager.deleteQuestionUnauthorized(questionId);
    });

    it('should return 401 if wrong credentials', async () => {
      await questionsTestManager.deleteQuestionUnauthorized(questionId, 'wrong', 'credentials');
    });
  });
});
