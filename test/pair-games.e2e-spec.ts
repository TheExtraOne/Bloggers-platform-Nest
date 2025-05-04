import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PairGamesTestManager } from './helpers/managers/pair-games-test-manager';
import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { GameStatus } from '../src/modules/quiz/pair-games/domain/pair-game.entity';
import { PGQuestionViewDto } from '../src/modules/quiz/questions/api/view-dto/question.view-dto';
import { TEST_USERS } from './helpers/test-constants';

describe('Pair Games Connection and Queries (e2e)', () => {
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
    // Only clear game-related data between tests
    await request(app.getHttpServer())
      .delete('/testing/game-data')
      .expect(HttpStatus.NO_CONTENT);
  });

  describe('POST /pair-game-quiz/pairs/connection', () => {
    it('should create new pair game when first user connects', async () => {
      // Connect first user
      const { statusCode, body } =
        await pairGamesTestManager.connectUser(user1Token);

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatus.PendingSecondPlayer,
        pairCreatedDate: expect.any(String),
        startGameDate: null,
        finishGameDate: null,
      });
    });

    it('should join existing pair game when second user connects', async () => {
      // First user creates a game
      await pairGamesTestManager.connectUser(user1Token);

      // Second user joins the game
      const { statusCode, body } =
        await pairGamesTestManager.connectUser(user2Token);

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user2.login,
          },
          score: 0,
          answers: [],
        },
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
          }),
        ]),
        status: GameStatus.Active,
        pairCreatedDate: expect.any(String),
        startGameDate: expect.any(String),
        finishGameDate: null,
      });
      expect(body.questions).toHaveLength(5);
    });

    it('should return 401 if user is not authenticated', async () => {
      const { statusCode } =
        await pairGamesTestManager.connectUser('invalid-token');
      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 if user is already in an active game', async () => {
      // First attempt should create a game
      await pairGamesTestManager.connectUser(user1Token);

      // Second attempt should fail
      const { statusCode } = await pairGamesTestManager.connectUser(user1Token);
      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /pair-game-quiz/pairs/:id', () => {
    let activeGameId: string;

    beforeEach(async () => {
      // Create an active game for these tests
      await pairGamesTestManager.connectUser(user1Token);
      const joinGameResponse =
        await pairGamesTestManager.connectUser(user2Token);
      activeGameId = joinGameResponse.body.id;
    });

    it('should return pair game by id for participating user', async () => {
      const { statusCode, body } = await pairGamesTestManager.getPairGameById(
        user1Token,
        activeGameId,
      );

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: activeGameId,
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user2.login,
          },
          score: 0,
          answers: [],
        },
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
          }),
        ]),
        status: GameStatus.Active,
        pairCreatedDate: expect.any(String),
        startGameDate: expect.any(String),
        finishGameDate: null,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const { statusCode } = await pairGamesTestManager.getPairGameById(
        'invalid-token',
        activeGameId,
      );
      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 if user is not participating in the game', async () => {
      // Create a third user that's not in the game
      await usersTestManager.createUser(
        {
          login: 'user3',
          email: 'user3@test.com',
          password: 'qwerty',
        },
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      );

      const thirdLoginResponse = await authTestManager.login({
        loginOrEmail: 'user3',
        password: 'qwerty',
      });

      const { statusCode } = await pairGamesTestManager.getPairGameById(
        thirdLoginResponse.body.accessToken,
        activeGameId,
      );
      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /pair-game-quiz/pairs/my-current', () => {
    it('should return current active game when user is participating', async () => {
      // Create and join a game
      await pairGamesTestManager.connectUser(user1Token);
      await pairGamesTestManager.connectUser(user2Token);

      // First user gets their current game
      const { statusCode, body } =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: {
            id: expect.any(String),
            login: TEST_USERS.user2.login,
          },
          score: 0,
          answers: [],
        },
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
          }),
        ]),
        status: GameStatus.Active,
        pairCreatedDate: expect.any(String),
        startGameDate: expect.any(String),
        finishGameDate: null,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const { statusCode } =
        await pairGamesTestManager.getMyCurrentPairGame('invalid-token');
      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 if user has no active game', async () => {
      // No game created, should return 404
      const { statusCode } =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
