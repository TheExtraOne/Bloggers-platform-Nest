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

describe('Pair Games Answers (e2e)', () => {
  let app: INestApplication;
  let pairGamesTestManager: PairGamesTestManager;
  let questionsTestManager: QuestionsTestManager;
  let usersTestManager: UsersTestManager;
  let authTestManager: AuthTestManager;
  let createdQuestions: PGQuestionViewDto[];
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;

  // Helper function to create and login a user
  const createAndLoginUser = async (userDetails: {
    login: string;
    password: string;
    email: string;
  }) => {
    try {
      await usersTestManager.createUser(
        userDetails,
        HttpStatus.CREATED,
        'admin',
        'qwerty',
      );
    } catch (error) {
      // If user already exists, that's fine - proceed to login
      if (error.response?.statusCode !== HttpStatus.BAD_REQUEST) {
        throw error;
      }
    }
    const loginResponse = await authTestManager.login({
      loginOrEmail: userDetails.login,
      password: userDetails.password,
    });
    return loginResponse.body.accessToken;
  };

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    questionsTestManager = result.questionsTestManager;
    usersTestManager = result.usersTestManager;
    authTestManager = result.authTestManager;
    pairGamesTestManager = result.pairGamesTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);

    // Create test questions using bulk helper method
    createdQuestions = await questionsTestManager.bulkCreateQuestions(5);

    // Publish all questions
    await Promise.all(
      createdQuestions.map((question) =>
        questionsTestManager.publishQuestion(question.id, true),
      ),
    );

    // Create and login test users
    user1Token = await createAndLoginUser(TEST_USERS.user1);
    user2Token = await createAndLoginUser(TEST_USERS.user2);

    // Create and start a game
    await pairGamesTestManager.connectUser(user1Token);
    await pairGamesTestManager.connectUser(user2Token);

    // Verify game is active
    const gameResponse =
      await pairGamesTestManager.getMyCurrentPairGame(user1Token);
    expect(gameResponse.statusCode).toBe(HttpStatus.OK);
    expect(gameResponse.body.status).toBe(GameStatus.Active);
  });

  afterAll(async () => {
    await deleteAllData(app);
    await app.close();
  });

  describe('POST /pair-game-quiz/pairs/my-current/answers', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await pairGamesTestManager.sendAnswer(
        'invalid_token',
        'Answer 1',
      );
      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 if user is not in active game', async () => {
      // Create and login a third user that's not in any game
      user3Token = await createAndLoginUser({
        login: 'user3',
        email: 'user3@test.com',
        password: 'qwerty',
      });

      const response = await pairGamesTestManager.sendAnswer(
        user3Token,
        'Answer 1',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return 400 if answer is empty', async () => {
      const response = await pairGamesTestManager.sendAnswer(user1Token, '');
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should correctly process correct answer', async () => {
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const questions = gameResponse.body.questions!;
      expect(questions.length).toBeGreaterThan(0);
      const firstQuestion = questions[0];

      const currentQuestion = createdQuestions.find(
        (q) => q.id === firstQuestion.id,
      );
      expect(currentQuestion).toBeDefined();

      const response = await pairGamesTestManager.sendAnswer(
        user1Token,
        currentQuestion!.correctAnswers[0],
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Correct);
    });

    it('should correctly process incorrect answer', async () => {
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const response = await pairGamesTestManager.sendAnswer(
        user1Token,
        'Wrong answer that does not match any correct answer',
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Incorrect);
    });

    it('should finish game when both players answer all questions', async () => {
      // Get initial game state
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      const { id: gameId, questions: gameQuestions } = gameResponse.body;

      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);
      expect(gameQuestions?.length).toBe(5);

      // Helper function to answer questions
      const answerAllQuestions = async (token: string) => {
        for (const question of gameQuestions!) {
          const currentQuestion = createdQuestions.find(
            (q) => q.id === question.id,
          );
          expect(currentQuestion).toBeDefined();

          const response = await pairGamesTestManager.sendAnswer(
            token,
            currentQuestion!.correctAnswers[0],
          );
          expect(response.statusCode).toBe(HttpStatus.OK);
        }
      };

      // Players answer questions sequentially
      await answerAllQuestions(user1Token);
      await answerAllQuestions(user2Token);

      // Verify game is finished
      const finalGameResponse = await pairGamesTestManager.getPairGameById(
        user1Token,
        gameId,
      );
      expect(finalGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(finalGameResponse.body.status).toBe(GameStatus.Finished);
    });

    it('should return 403 when trying to answer after game is finished', async () => {
      // Get initial game state
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      const { id: gameId, questions: gameQuestions } = gameResponse.body;

      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);
      expect(gameQuestions?.length).toBe(5);

      // Helper function to answer questions
      const answerAllQuestions = async (token: string) => {
        for (const question of gameQuestions!) {
          const currentQuestion = createdQuestions.find(
            (q) => q.id === question.id,
          );
          expect(currentQuestion).toBeDefined();

          const response = await pairGamesTestManager.sendAnswer(
            token,
            currentQuestion!.correctAnswers[0],
          );
          expect(response.statusCode).toBe(HttpStatus.OK);
        }
      };

      // Players answer questions sequentially
      await answerAllQuestions(user1Token);
      await answerAllQuestions(user2Token);

      // Verify game is finished
      const finalGameResponse = await pairGamesTestManager.getPairGameById(
        user1Token,
        gameId,
      );
      expect(finalGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(finalGameResponse.body.status).toBe(GameStatus.Finished);

      // Try to answer again
      const response = await pairGamesTestManager.sendAnswer(
        user1Token,
        'Any answer',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
