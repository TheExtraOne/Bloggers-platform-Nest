import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PairGamesTestManager } from './helpers/managers/pair-games-test-manager';
import { QuestionsTestManager } from './helpers/managers/questions-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { GameStatus } from '../src/modules/quiz/pair-games/domain/pair-game.entity';
import { PGQuestionViewDto } from '../src/modules/quiz/questions/api/view-dto/question.view-dto';
import { TEST_USERS } from './helpers/test-constants';
import { AnswerStatus } from '../src/modules/quiz/answers/domain/answers.entity';

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
      await usersTestManager.createUser(TEST_USERS.user1);
      await usersTestManager.createUser(TEST_USERS.user2);
    });

    it('should create new pair game when first user connects', async () => {
      // Login first user
      const loginResponse = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
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
      // Login both users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      });

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user2.login,
        password: TEST_USERS.user2.password,
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
      // Login first user
      const loginResponse = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
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
      await usersTestManager.createUser(TEST_USERS.user1);
      await usersTestManager.createUser(TEST_USERS.user2);
    });

    it('should return pair game by id for participating user', async () => {
      // Login both users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      });

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user2.login,
        password: TEST_USERS.user2.password,
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
      // Login and create a game
      const loginResponse = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
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
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      });
      const loginResponse2 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user2.login,
        password: TEST_USERS.user2.password,
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

  describe('GET /pair-game-quiz/pairs/my-current', () => {
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
      await usersTestManager.createUser(TEST_USERS.user1);
      await usersTestManager.createUser(TEST_USERS.user2);
    });

    it('should return current active game when user is participating', async () => {
      // Login both users
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      });

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: TEST_USERS.user2.login,
        password: TEST_USERS.user2.password,
      });

      // First user creates a game
      const createGameResponse = await pairGamesTestManager.connectUser(
        loginResponse1.body.accessToken,
      );

      // Second user joins the game
      await pairGamesTestManager.connectUser(loginResponse2.body.accessToken);

      // First user gets their current game
      const { statusCode, body } =
        await pairGamesTestManager.getMyCurrentPairGame(
          loginResponse1.body.accessToken,
        );

      expect(statusCode).toBe(HttpStatus.OK);
      expect(body).toEqual({
        id: createGameResponse.body.id,
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
        await pairGamesTestManager.getMyCurrentPairGame('invalid-token');
      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 if user has no active game', async () => {
      // Login user
      const loginResponse = await authTestManager.login({
        loginOrEmail: TEST_USERS.user1.login,
        password: TEST_USERS.user1.password,
      });

      // Try to get current game without creating one
      const { statusCode } = await pairGamesTestManager.getMyCurrentPairGame(
        loginResponse.body.accessToken,
      );
      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /pair-game-quiz/pairs/my-current/answers', () => {
    let createdQuestions: PGQuestionViewDto[];
    let firstPlayerToken: string;
    let secondPlayerToken: string;

    beforeEach(async () => {
      // Create and publish 5 questions
      createdQuestions = [];
      for (let i = 1; i <= 5; i++) {
        const question = await questionsTestManager.createQuestion({
          body: `Question ${i}`,
          correctAnswers: [`Answer ${i}`],
        });
        await questionsTestManager.publishQuestion(question.id, true);
        createdQuestions.push(question);
      }

      // Create and login two users
      await usersTestManager.createUser({
        login: 'user1',
        email: 'user1@test.com',
        password: 'qwerty',
      });
      await usersTestManager.createUser({
        login: 'user2',
        email: 'user2@test.com',
        password: 'qwerty',
      });

      const [firstLoginResponse, secondLoginResponse] = await Promise.all([
        (async () => {
          return authTestManager.login({
            loginOrEmail: 'user1',
            password: 'qwerty',
          });
        })(),
        (async () => {
          return authTestManager.login({
            loginOrEmail: 'user2',
            password: 'qwerty',
          });
        })(),
      ]);

      firstPlayerToken = firstLoginResponse.body.accessToken;
      secondPlayerToken = secondLoginResponse.body.accessToken;

      // Connect both users to create a game
      await pairGamesTestManager.connectUser(firstPlayerToken);
      const gameResponse =
        await pairGamesTestManager.connectUser(secondPlayerToken);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await pairGamesTestManager.sendAnswer(
        'invalid_token',
        'Answer 1',
      );
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 if user is not in active game', async () => {
      // Create and login a third user that's not in any game
      await usersTestManager.createUser({
        login: 'user3',
        email: 'user3@test.com',
        password: 'qwerty',
      });

      const thirdLoginResponse = await authTestManager.login({
        loginOrEmail: 'user3',
        password: 'qwerty',
      });

      const response = await pairGamesTestManager.sendAnswer(
        thirdLoginResponse.body.accessToken,
        'Answer 1',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return 400 if answer is empty', async () => {
      const response = await pairGamesTestManager.sendAnswer(
        firstPlayerToken,
        '',
      );
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should correctly process correct answer', async () => {
      // Get current game to verify questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(firstPlayerToken);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      // Get the current question from game questions
      const gameQuestions = gameResponse.body.questions || [];
      expect(gameQuestions.length).toBeGreaterThan(0);

      const firstQuestion = gameQuestions[0];
      expect(firstQuestion).toBeDefined();

      // Find the matching created question with correct answers
      const currentQuestion = createdQuestions.find(
        (q) => q.id === firstQuestion.id,
      );
      if (!currentQuestion) {
        throw new Error(`Could not find question with ID ${firstQuestion.id}`);
      }

      // Send the first correct answer
      const correctAnswer = currentQuestion.correctAnswers[0];

      const response = await pairGamesTestManager.sendAnswer(
        firstPlayerToken,
        correctAnswer,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Correct);
      expect(response.body.questionId).toBe(firstQuestion.id);
    });

    it('should correctly process incorrect answer', async () => {
      // Get current game to verify questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(firstPlayerToken);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      // Get the current question
      const gameQuestions = gameResponse.body.questions || [];
      expect(gameQuestions.length).toBeGreaterThan(0);

      const firstQuestion = gameQuestions[0];
      expect(firstQuestion).toBeDefined();

      const response = await pairGamesTestManager.sendAnswer(
        firstPlayerToken,
        'Wrong answer that does not match any correct answer',
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Incorrect);
      expect(response.body.questionId).toBe(firstQuestion.id);
    });

    it('should finish game when both players answer all questions', async () => {
      // Get current game and questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(firstPlayerToken);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const gameId = gameResponse.body.id;
      const gameQuestions = gameResponse.body.questions || [];
      expect(gameQuestions.length).toBe(5);

      // First player answers all questions
      for (const question of gameQuestions) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          firstPlayerToken,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Second player answers all questions except last one
      for (let i = 0; i < gameQuestions.length - 1; i++) {
        const question = gameQuestions[i];
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          secondPlayerToken,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Verify game is still active
      let currentGameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(firstPlayerToken);
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Active);

      // Second player answers last question
      const lastQuestion = gameQuestions[gameQuestions.length - 1];
      const lastCreatedQuestion = createdQuestions.find(
        (q) => q.id === lastQuestion.id,
      );
      if (!lastCreatedQuestion) {
        throw new Error(`Could not find question with ID ${lastQuestion.id}`);
      }

      const response = await pairGamesTestManager.sendAnswer(
        secondPlayerToken,
        lastCreatedQuestion.correctAnswers[0],
      );
      expect(response.statusCode).toBe(HttpStatus.OK);

      // Verify game is finished - use getPairGameById since the game is no longer "current"
      currentGameResponse = await pairGamesTestManager.getPairGameById(
        firstPlayerToken,
        gameId,
      );
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Finished);
    });

    it('should return 403 when trying to answer after game is finished', async () => {
      // Get current game and questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(firstPlayerToken);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const gameId = gameResponse.body.id;
      const gameQuestions = gameResponse.body.questions || [];
      expect(gameQuestions.length).toBe(5);

      // First player answers all questions
      for (const question of gameQuestions) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          firstPlayerToken,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Second player answers all questions
      for (const question of gameQuestions) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          secondPlayerToken,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Verify game is finished - use getPairGameById since the game is no longer "current"
      const currentGameResponse = await pairGamesTestManager.getPairGameById(
        firstPlayerToken,
        gameId,
      );
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Finished);

      // Try to answer again
      const response = await pairGamesTestManager.sendAnswer(
        firstPlayerToken,
        'Any answer',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
