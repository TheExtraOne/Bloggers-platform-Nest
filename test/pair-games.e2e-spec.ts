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

    // Clear all data and set up test data in parallel where possible
    await deleteAllData(app);

    // Create users and get tokens in parallel
    await Promise.all([
      usersTestManager.createUser(
        TEST_USERS.user1,
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      ),
      usersTestManager.createUser(
        TEST_USERS.user2,
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      ),
    ]);

    const [loginResponse1, loginResponse2] = await Promise.all([
      authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      }),
      authTestManager.login({
        loginOrEmail: TEST_USERS.user2.login,
        password: TEST_USERS.user2.password,
      }),
    ]);

    user1Token = loginResponse1.body.accessToken;
    user2Token = loginResponse2.body.accessToken;

    // Batch create and publish questions in one operation
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
    // Clear game data only for tests that need a clean state
    const testName = expect.getState().currentTestName;
    if (
      testName?.includes('should create new pair game') ||
      testName?.includes('should join existing pair game') ||
      testName?.includes(
        'should return 403 if user is already in an active game',
      ) ||
      testName?.includes('should return current active game')
    ) {
      await request(app.getHttpServer())
        .delete('/testing/game-data')
        .expect(HttpStatus.NO_CONTENT);
    }
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
      const user3 = {
        login: 'user3',
        email: 'user3@test.com',
        password: 'qwerty',
      };

      await usersTestManager.createUser(
        user3,
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      );

      const thirdLoginResponse = await authTestManager.login({
        loginOrEmail: user3.login,
        password: user3.password,
      });

      // First verify the game exists and get its ID
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      const gameId = gameResponse.body.id;

      // Then try to access with unauthorized user
      const response = await pairGamesTestManager.getPairGameById(
        thirdLoginResponse.body.accessToken,
        gameId,
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);

      // Verify game is still accessible by original user
      const originalUserResponse = await pairGamesTestManager.getPairGameById(
        user1Token,
        gameId,
      );
      expect(originalUserResponse.statusCode).toBe(HttpStatus.OK);
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
      // Clear any existing games
      await request(app.getHttpServer())
        .delete('/testing/game-data')
        .expect(HttpStatus.NO_CONTENT);

      // Try to get current game when none exists
      const { statusCode } =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
