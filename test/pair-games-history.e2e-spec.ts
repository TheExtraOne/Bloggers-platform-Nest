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

describe('Pair Games History (e2e)', () => {
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
  });

  afterAll(async () => {
    await deleteAllData(app);
    await app.close();
  });

  // Helper functions moved outside beforeEach for reusability
  async function setupTestData() {
    // Create and publish test questions in bulk
    createdQuestions = await questionsTestManager.bulkCreateQuestions(5);

    // Create users and publish questions in parallel
    await Promise.all([
      ...createdQuestions.map((question) =>
        questionsTestManager.publishQuestion(question.id, true),
      ),
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

    // Login users in parallel
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

    return {
      user1Token: loginResponse1.body.accessToken,
      user2Token: loginResponse2.body.accessToken,
    };
  }

  async function setupGame(
    firstPlayerAnswers: number,
    secondPlayerAnswers: number,
    alternateSecondPlayer = true,
  ) {
    await pairGamesTestManager.connectUser(user1Token);
    const game = await pairGamesTestManager.connectUser(user2Token);
    const gameQuestions = game.body.questions;
    expect(gameQuestions).toBeDefined();
    expect(gameQuestions?.length).toBe(5);

    // Send answers sequentially to avoid deadlocks
    for (
      let i = 0;
      i < Math.max(firstPlayerAnswers, secondPlayerAnswers);
      i++
    ) {
      const question = gameQuestions![i];
      const correctQuestion = createdQuestions.find(
        (q) => q.id === question.id,
      );
      if (!correctQuestion) {
        throw new Error(`Could not find question with ID ${question.id}`);
      }

      // First player answers first, then second player answers - sequential execution prevents race conditions
      if (i < firstPlayerAnswers) {
        await pairGamesTestManager.sendAnswer(
          user1Token,
          correctQuestion.correctAnswers[0],
        );
      }

      if (i < secondPlayerAnswers) {
        await pairGamesTestManager.sendAnswer(
          user2Token,
          alternateSecondPlayer && i % 2 === 0
            ? correctQuestion.correctAnswers[0]
            : 'Wrong answer',
        );
      }
    }
    return game;
  }

  beforeEach(async () => {
    await deleteAllData(app);

    // Setup test data and get tokens
    const tokens = await setupTestData();
    user1Token = tokens.user1Token;
    user2Token = tokens.user2Token;

    // Setup games sequentially to ensure proper transaction handling
    await setupGame(5, 5, true); // Game 1: Complete game with mixed answers
    await setupGame(2, 0); // Game 2: Active game with partial answers
  });

  describe('GET /pair-game-quiz/pairs/my', () => {
    it('should return paginated list of user games', async () => {
      const response = await pairGamesTestManager.getMyPairGames(user1Token);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            status: GameStatus.Finished,
            firstPlayerProgress: expect.objectContaining({
              answers: expect.arrayContaining([
                expect.objectContaining({
                  answerStatus: AnswerStatus.Correct,
                }),
              ]),
            }),
            secondPlayerProgress: expect.objectContaining({
              answers: expect.arrayContaining([
                expect.objectContaining({
                  answerStatus: AnswerStatus.Correct,
                }),
                expect.objectContaining({
                  answerStatus: AnswerStatus.Incorrect,
                }),
              ]),
            }),
          }),
          expect.objectContaining({
            status: GameStatus.Active,
            firstPlayerProgress: expect.objectContaining({
              answers: expect.arrayContaining([
                expect.objectContaining({
                  answerStatus: AnswerStatus.Correct,
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    it('should return empty list for user with no games', async () => {
      // Create and login new user with no games
      await usersTestManager.createUser(
        {
          login: 'newuser',
          email: 'newuser@test.com',
          password: 'qwerty',
        },
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      );

      const loginResponse = await authTestManager.login({
        loginOrEmail: 'newuser',
        password: 'qwerty',
      });

      const response = await pairGamesTestManager.getMyPairGames(
        loginResponse.body.accessToken,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const response =
        await pairGamesTestManager.getMyPairGames('invalid_token');
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should support pagination and sorting', async () => {
      const response = await pairGamesTestManager.getMyPairGames(user1Token, {
        sortBy: 'pairCreatedDate',
        sortDirection: 'desc',
        pageNumber: 1,
        pageSize: 1,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 1,
        totalCount: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            status: GameStatus.Active,
          }),
        ]),
      });

      // Get second page
      const page2Response = await pairGamesTestManager.getMyPairGames(
        user1Token,
        {
          sortBy: 'pairCreatedDate',
          sortDirection: 'desc',
          pageNumber: 2,
          pageSize: 1,
        },
      );

      expect(page2Response.statusCode).toBe(HttpStatus.OK);
      expect(page2Response.body).toEqual({
        pagesCount: 2,
        page: 2,
        pageSize: 1,
        totalCount: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            status: GameStatus.Finished,
          }),
        ]),
      });
    });

    it('should sort by different fields', async () => {
      // Sort by status ascending
      const statusAscResponse = await pairGamesTestManager.getMyPairGames(
        user1Token,
        {
          sortBy: 'status',
          sortDirection: 'asc',
        },
      );

      expect(statusAscResponse.statusCode).toBe(HttpStatus.OK);
      expect(statusAscResponse.body.items[0].status).toBe(GameStatus.Active);
      expect(statusAscResponse.body.items[1].status).toBe(GameStatus.Finished);

      // Sort by status descending
      const statusDescResponse = await pairGamesTestManager.getMyPairGames(
        user1Token,
        {
          sortBy: 'status',
          sortDirection: 'desc',
        },
      );

      expect(statusDescResponse.statusCode).toBe(HttpStatus.OK);
      expect(statusDescResponse.body.items[0].status).toBe(GameStatus.Finished);
      expect(statusDescResponse.body.items[1].status).toBe(GameStatus.Active);
    });
  });
});
