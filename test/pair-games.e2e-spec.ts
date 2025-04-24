import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PairGamesTestManager } from './helpers/managers/pair-games-test-manager';
import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { GameStatus } from '../src/modules/quiz/pair-games/domain/pair-game.entity';
import { PGQuestionViewDto } from '../src/modules/quiz/questions/api/view-dto/question.view-dto';

describe('Pair Games Controller (e2e)', () => {
  let app: INestApplication;
  let pairGamesTestManager: PairGamesTestManager;
  let questionsTestManager: QuestionsTestManager;
  let usersTestManager: UsersTestManager;
  let authTestManager: AuthTestManager;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    questionsTestManager = result.questionsTestManager;
    usersTestManager = result.usersTestManager;
    authTestManager = result.authTestManager;
    pairGamesTestManager = result.pairGamesTestManager;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('POST /pair-game-quiz/pairs/connection', () => {
    const user1 = {
      login: 'user1',
      password: 'password123',
      email: 'user1@test.com',
    };

    const user2 = {
      login: 'user2',
      password: 'password123',
      email: 'user2@test.com',
    };

    beforeEach(async () => {
      // Create and publish 5 questions
      const createdQuestions: PGQuestionViewDto[] = [];
      for (let i = 1; i <= 5; i++) {
        const question = await questionsTestManager.createQuestion({
          body: `Question ${i}`,
          correctAnswers: [`Answer ${i}`],
        });
        createdQuestions.push(question);
      }

      // Publish each question
      for (const question of createdQuestions) {
        await questionsTestManager.publishQuestion(question.id, true);
      }

      // Create test users
      await usersTestManager.createUser(user1);
      await usersTestManager.createUser(user2);
    });

    it('should create new pair game when first user connects', async () => {
      // Login first user
      const loginResponse = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });

      // Connect first user
      const { statusCode, body } = await pairGamesTestManager.connectUser(
        loginResponse.body.accessToken,
      );

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: user1.login,
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
      // Login both users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      });

      // First user creates a game
      await pairGamesTestManager.connectUser(loginResponse1.body.accessToken);

      // Second user joins the game
      const { statusCode, body } = await pairGamesTestManager.connectUser(
        loginResponse2.body.accessToken,
      );

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: {
            id: expect.any(String),
            login: user2.login,
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
      // Login first user
      const loginResponse = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });

      // First attempt should create a game
      await pairGamesTestManager.connectUser(loginResponse.body.accessToken);

      // Second attempt should fail
      const { statusCode } = await pairGamesTestManager.connectUser(
        loginResponse.body.accessToken,
      );
      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /pair-game-quiz/pairs/:id', () => {
    const user1 = {
      login: 'user1',
      password: 'password123',
      email: 'user1@test.com',
    };

    const user2 = {
      login: 'user2',
      password: 'password123',
      email: 'user2@test.com',
    };

    beforeEach(async () => {
      // Create and publish 5 questions
      const createdQuestions: PGQuestionViewDto[] = [];
      for (let i = 1; i <= 5; i++) {
        const question = await questionsTestManager.createQuestion({
          body: `Question ${i}`,
          correctAnswers: [`Answer ${i}`],
        });
        createdQuestions.push(question);
      }

      // Publish each question
      for (const question of createdQuestions) {
        await questionsTestManager.publishQuestion(question.id, true);
      }

      // Create test users
      await usersTestManager.createUser(user1);
      await usersTestManager.createUser(user2);
    });

    it('should return pair game by id for participating user', async () => {
      // Login both users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      });

      // First user creates a game
      const createGameResponse = await pairGamesTestManager.connectUser(
        loginResponse1.body.accessToken,
      );

      // Second user joins the game
      await pairGamesTestManager.connectUser(loginResponse2.body.accessToken);

      // First user tries to get the game
      const { statusCode, body } = await pairGamesTestManager.getPairGameById(
        loginResponse1.body.accessToken,
        createGameResponse.body.id,
      );

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: createGameResponse.body.id,
        firstPlayerProgress: {
          player: {
            id: expect.any(String),
            login: user1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: {
            id: expect.any(String),
            login: user2.login,
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
      // Login and create a game
      const loginResponse = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });
      const createGameResponse = await pairGamesTestManager.connectUser(
        loginResponse.body.accessToken,
      );

      // Try to get game with invalid token
      const { statusCode } = await pairGamesTestManager.getPairGameById(
        'invalid-token',
        createGameResponse.body.id,
      );
      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 if user is not participating in the game', async () => {
      // Login users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });
      const loginResponse2 = await authTestManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      });

      // Create a game with first user
      const createGameResponse = await pairGamesTestManager.connectUser(
        loginResponse1.body.accessToken,
      );

      // Second user (not participating) tries to get the game
      const { statusCode } = await pairGamesTestManager.getPairGameById(
        loginResponse2.body.accessToken,
        createGameResponse.body.id,
      );
      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
