import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PairGamesTestManager } from './helpers/managers/pair-games-test-manager';
import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { PGQuestionViewDto } from '../src/modules/quiz/questions/api/view-dto/question.view-dto';
import { TEST_USERS } from './helpers/test-constants';
import request from 'supertest';
import { TopUsersSort } from '../src/modules/quiz/pair-games/api/input-dto/top-users-sort';

describe('Pair Games Users (e2e)', () => {
  let app: INestApplication;
  let pairGamesTestManager: PairGamesTestManager;
  let questionsTestManager: QuestionsTestManager;
  let usersTestManager: UsersTestManager;
  let authTestManager: AuthTestManager;
  let createdQuestions: PGQuestionViewDto[] = [];
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    questionsTestManager = result.questionsTestManager;
    usersTestManager = result.usersTestManager;
    authTestManager = result.authTestManager;
    pairGamesTestManager = result.pairGamesTestManager;

    // Clear all data once at the start
    await deleteAllData(app);

    // Create test users with proper admin credentials
    await usersTestManager.createUser(
      TEST_USERS.user1,
      HttpStatus.CREATED,
      'admin',
      'qwerty',
    );
    await usersTestManager.createUser(
      TEST_USERS.user2,
      HttpStatus.CREATED,
      'admin',
      'qwerty',
    );

    // Login users and store tokens
    const loginResponse1 = await authTestManager.login({
      loginOrEmail: TEST_USERS.user1.login,
      password: TEST_USERS.user1.password,
    });
    user1Token = loginResponse1.body.accessToken;

    const loginResponse2 = await authTestManager.login({
      loginOrEmail: TEST_USERS.user2.login,
      password: TEST_USERS.user2.password,
    });
    user2Token = loginResponse2.body.accessToken;

    // Create and publish test questions in bulk
    createdQuestions = await questionsTestManager.bulkCreateQuestions(5);
    await Promise.all(
      createdQuestions.map((question) =>
        questionsTestManager.publishQuestion(question.id, true),
      ),
    );
  });

  afterAll(async () => {
    await deleteAllData(app);
    await app.close();
  });

  beforeEach(async () => {
    // Clear game-related data between tests
    await request(app.getHttpServer())
      .delete('/testing/game-data')
      .expect(HttpStatus.NO_CONTENT);
  });

  describe('GET /pair-game-quiz/users/top', () => {
    it('should return empty paginated result when no games played', async () => {
      const response = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return top users with default sorting (avgScores desc, sumScore desc)', async () => {
      // Create and finish a game to generate statistics
      await pairGamesTestManager.connectUser(user1Token);
      const game = await pairGamesTestManager.connectUser(user2Token);

      // Answer questions for both users to generate different scores
      if (game.body.questions) {
        for (let i = 0; i < 5; i++) {
          await pairGamesTestManager.sendAnswer(user1Token, 'correct');
          await pairGamesTestManager.sendAnswer(
            user2Token,
            i < 3 ? 'correct' : 'incorrect',
          );
        }
      }

      const response = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            avgScores: expect.any(Number),
            sumScore: expect.any(Number),
            gamesCount: 1,
            winsCount: expect.any(Number),
            lossesCount: expect.any(Number),
            drawsCount: expect.any(Number),
            player: expect.objectContaining({
              id: expect.any(String),
              login: expect.any(String),
            }),
          }),
        ]),
      });

      // Verify sorting
      const items = response.body.items;
      expect(items[0].avgScores).toBeGreaterThanOrEqual(items[1].avgScores);
    });

    it('should sort by specified field and direction', async () => {
      // Create and finish a game to generate statistics
      await pairGamesTestManager.connectUser(user1Token);
      const game = await pairGamesTestManager.connectUser(user2Token);

      // Answer questions for both users
      if (game.body.questions) {
        for (let i = 0; i < 5; i++) {
          await pairGamesTestManager.sendAnswer(user1Token, 'correct');
          await pairGamesTestManager.sendAnswer(
            user2Token,
            i < 2 ? 'correct' : 'incorrect',
          );
        }
      }

      const response = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .query({ sort: `${TopUsersSort.WinsCount} desc` })
        .expect(HttpStatus.OK);

      // Verify sorting by wins
      const items = response.body.items;
      expect(items[0].winsCount).toBeGreaterThanOrEqual(items[1].winsCount);
    });

    it('should paginate results correctly', async () => {
      // Create and finish a game to generate statistics
      await pairGamesTestManager.connectUser(user1Token);
      await pairGamesTestManager.connectUser(user2Token);

      const response = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .query({ pageNumber: 1, pageSize: 1 })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        pagesCount: 2,
        page: 1,
        pageSize: 1,
        totalCount: 2,
        items: expect.any(Array),
      });
      expect(response.body.items).toHaveLength(1);
    });

    it('should validate query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/pair-game-quiz/users/top')
        .query({ pageNumber: 0, pageSize: 0 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('errorsMessages');
    });
  });
});
