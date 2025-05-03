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
    try {
      console.log('Initializing test environment...');
      const result = await new TestSettingsInitializer().init();
      app = result.app;
      questionsTestManager = result.questionsTestManager;
      httpServer = result.httpServer;
      console.log('Test environment initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await deleteAllData(app);
      await app.close();
    }
  });

  describe('GET /sa/quiz/questions - get all questions with filters', () => {
    let questions: PGQuestionViewDto[];

    beforeEach(async () => {
      await deleteAllData(app);
      questions = await questionsTestManager.createTestQuestions();
    });
    it('should handle pagination, filtering, and sorting correctly', async () => {
      // Test default pagination and structure
      const defaultResponse = await questionsTestManager.getAllQuestions();
      expect(defaultResponse).toMatchObject({
        totalCount: 3,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
            correctAnswers: expect.any(Array),
            published: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: null,
          }),
        ]),
      });

      // Test search functionality
      const searchResponse =
        await questionsTestManager.searchQuestions('Question 1');
      expect(searchResponse.items).toHaveLength(1);
      expect(searchResponse.items[0]).toMatchObject({
        id: questions[0].id,
        body: 'Question 1?',
      });

      // Test sorting
      // Sort questions by createdAt to ensure consistent order
      const sortedQuestions = [...questions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const [descResponse, ascResponse] = await Promise.all([
        questionsTestManager.getSortedQuestions(
          QuestionsSortBy.CreatedAt,
          'desc',
        ),
        questionsTestManager.getSortedQuestions(
          QuestionsSortBy.CreatedAt,
          'asc',
        ),
      ]);

      expect(descResponse.items[0].id).toBe(sortedQuestions[0].id);
      expect(ascResponse.items[0].id).toBe(
        sortedQuestions[sortedQuestions.length - 1].id,
      );

      // Test custom pagination
      const [firstPage, secondPage] = await Promise.all([
        questionsTestManager.getPaginatedQuestions(1, 2),
        questionsTestManager.getPaginatedQuestions(2, 2),
      ]);

      // Verify pagination structure and counts
      expect(firstPage).toMatchObject({
        totalCount: 3,
        pagesCount: 2,
        page: 1,
        pageSize: 2,
        items: expect.any(Array),
      });
      expect(firstPage.items).toHaveLength(2);

      expect(secondPage).toMatchObject({
        totalCount: 3,
        pagesCount: 2,
        page: 2,
        pageSize: 2,
        items: expect.any(Array),
      });
      expect(secondPage.items).toHaveLength(1);

      // Verify items are different between pages
      const firstPageIds = firstPage.items.map((q) => q.id);
      const secondPageIds = secondPage.items.map((q) => q.id);
      expect(firstPageIds).not.toContain(secondPageIds[0]);
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
        updatedAt: null,
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
      const { items: beforeItems } =
        await questionsTestManager.getAllQuestions();
      expect(beforeItems.map((q) => q.id)).toContain(questionId);

      // Delete the question
      await questionsTestManager.deleteQuestion(questionId);

      // Verify question doesn't appear in the list
      const { items: afterItems } =
        await questionsTestManager.getAllQuestions();
      expect(afterItems.map((q) => q.id)).not.toContain(questionId);
    });

    it('should return 404 if question not found', async () => {
      const nonExistentId = '999999';
      await questionsTestManager.deleteQuestion(
        nonExistentId,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 401 if unauthorized', async () => {
      await questionsTestManager.deleteQuestionUnauthorized(questionId);
    });

    it('should return 401 if wrong credentials', async () => {
      await questionsTestManager.deleteQuestionUnauthorized(
        questionId,
        'wrong',
        'credentials',
      );
    });
  });

  describe('PUT /sa/quiz/questions/:id/publish - publish/unpublish question', () => {
    let questionId: string;

    beforeEach(async () => {
      const question = await questionsTestManager.createQuestion({
        body: 'Test question for publish operations?',
        correctAnswers: ['Test answer'],
      });
      questionId = question.id;
    });

    it('should handle successful publish/unpublish', async () => {
      // Test publish
      await questionsTestManager.publishQuestion(questionId, true);

      const { items: publishedItems } =
        await questionsTestManager.getAllQuestions();
      const publishedQuestion = publishedItems.find((q) => q.id === questionId);
      expect(publishedQuestion.published).toBe(true);

      // Test unpublish
      await questionsTestManager.publishQuestion(questionId, false);

      const { items: unpublishedItems } =
        await questionsTestManager.getAllQuestions();
      const unpublishedQuestion = unpublishedItems.find(
        (q) => q.id === questionId,
      );
      expect(unpublishedQuestion.published).toBe(false);
    });

    it('should handle error scenarios', async () => {
      await Promise.all([
        // Invalid cases
        questionsTestManager.publishQuestionInvalid(questionId, {}),
        questionsTestManager.publishQuestionInvalid(questionId, {
          published: 'true',
        }),
        questionsTestManager.publishQuestion(
          '999999',
          true,
          HttpStatus.NOT_FOUND,
        ),
        // Unauthorized cases
        questionsTestManager.publishQuestionUnauthorized(questionId, true),
        questionsTestManager.publishQuestionUnauthorized(
          questionId,
          true,
          'wrong',
          'credentials',
        ),
      ]);
    });
  });

  describe('PUT /sa/quiz/questions/:id - update question', () => {
    let questionId: string;

    beforeEach(async () => {
      const question = await questionsTestManager.createQuestion({
        body: 'Test question for update operations?',
        correctAnswers: ['Test answer'],
      });
      questionId = question.id;
    });

    it('should handle successful update', async () => {
      const updateDto = {
        body: 'Updated question body?',
        correctAnswers: ['Updated answer'],
      };
      await questionsTestManager.updateQuestion(questionId, updateDto);
      // Add a small delay to ensure database sync
      const { items: updatedItems } =
        await questionsTestManager.getAllQuestions();
      const updatedQuestion = updatedItems.find((q) => q.id === questionId);
      expect(updatedQuestion).toMatchObject({
        body: updateDto.body,
        correctAnswers: updateDto.correctAnswers,
      });
    });

    it('should handle error scenarios', async () => {
      const validBody = 'Valid question body?';
      const validAnswer = ['Answer'];

      await Promise.all([
        // Invalid cases
        questionsTestManager.updateQuestionInvalid(questionId, {
          body: 'Short?',
          correctAnswers: validAnswer,
        }),
        questionsTestManager.updateQuestionInvalid(questionId, {
          body: 'a'.repeat(501),
          correctAnswers: validAnswer,
        }),
        questionsTestManager.updateQuestionInvalid(questionId, {
          body: validBody,
          correctAnswers: [],
        }),
        questionsTestManager.updateQuestionInvalid(questionId, {
          body: validBody,
          correctAnswers: [123 as any],
        }),
        questionsTestManager.updateQuestion(
          '999999',
          { body: validBody, correctAnswers: validAnswer },
          HttpStatus.NOT_FOUND,
        ),
        // Unauthorized cases
        questionsTestManager.updateQuestionUnauthorized(questionId, {
          body: validBody,
          correctAnswers: validAnswer,
        }),
        questionsTestManager.updateQuestionUnauthorized(
          questionId,
          { body: validBody, correctAnswers: validAnswer },
          'wrong',
          'credentials',
        ),
      ]);
    });
  });
});
