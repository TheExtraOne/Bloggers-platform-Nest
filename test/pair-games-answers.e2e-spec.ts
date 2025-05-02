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

  beforeEach(async () => {
    // Delete all data
    await deleteAllData(app);

    // Create test questions
    createdQuestions = [];
    for (let i = 1; i <= 5; i++) {
      const question = await questionsTestManager.createQuestion({
        body: `Question ${i}`,
        correctAnswers: [`Answer ${i}`],
      });
      createdQuestions.push(question);
      await questionsTestManager.publishQuestion(question.id, true);
    }

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

    // Create and start a game for answer tests
    await pairGamesTestManager.connectUser(user1Token);
    await pairGamesTestManager.connectUser(user2Token);
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
      // Create a third user that's not in any game
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

      const response = await pairGamesTestManager.sendAnswer(
        thirdLoginResponse.body.accessToken,
        'Answer 1',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return 400 if answer is empty', async () => {
      const response = await pairGamesTestManager.sendAnswer(user1Token, '');
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should correctly process correct answer', async () => {
      // Get current game to verify questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      // Get the current question from game questions
      const gameQuestions = gameResponse.body.questions;
      expect(gameQuestions).toBeDefined();
      expect(gameQuestions?.length).toBeGreaterThan(0);

      const firstQuestion = gameQuestions![0];
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
        user1Token,
        correctAnswer,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Correct);
    });

    it('should correctly process incorrect answer', async () => {
      // Get current game to verify questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      // Get the current question
      const gameQuestions = gameResponse.body.questions;
      expect(gameQuestions).toBeDefined();
      expect(gameQuestions?.length).toBeGreaterThan(0);

      const firstQuestion = gameQuestions![0];
      expect(firstQuestion).toBeDefined();

      const response = await pairGamesTestManager.sendAnswer(
        user1Token,
        'Wrong answer that does not match any correct answer',
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.answerStatus).toBe(AnswerStatus.Incorrect);
    });

    it('should finish game when both players answer all questions', async () => {
      // Get current game and questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const gameId = gameResponse.body.id;
      const gameQuestions = gameResponse.body.questions;
      expect(gameQuestions).toBeDefined();
      expect(gameQuestions?.length).toBe(5);

      // First player answers all questions
      for (const question of gameQuestions!) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          user1Token,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Second player answers all but last question
      for (let i = 0; i < gameQuestions!.length - 1; i++) {
        const question = gameQuestions![i];
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          user2Token,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Verify game is still active
      let currentGameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Active);

      // Second player answers last question
      const lastQuestion = gameQuestions![gameQuestions!.length - 1];
      const lastCreatedQuestion = createdQuestions.find(
        (q) => q.id === lastQuestion.id,
      );
      if (!lastCreatedQuestion) {
        throw new Error(`Could not find question with ID ${lastQuestion.id}`);
      }

      const response = await pairGamesTestManager.sendAnswer(
        user2Token,
        lastCreatedQuestion.correctAnswers[0],
      );
      expect(response.statusCode).toBe(HttpStatus.OK);

      // Verify game is finished - use getPairGameById since the game is no longer "current"
      currentGameResponse = await pairGamesTestManager.getPairGameById(
        user1Token,
        gameId,
      );
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Finished);
    });

    it('should return 403 when trying to answer after game is finished', async () => {
      // Get current game and questions
      const gameResponse =
        await pairGamesTestManager.getMyCurrentPairGame(user1Token);
      expect(gameResponse.statusCode).toBe(HttpStatus.OK);
      expect(gameResponse.body.status).toBe(GameStatus.Active);

      const gameId = gameResponse.body.id;
      const gameQuestions = gameResponse.body.questions;
      expect(gameQuestions).toBeDefined();
      expect(gameQuestions?.length).toBe(5);

      // First player answers all questions
      for (const question of gameQuestions!) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          user1Token,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Second player answers all questions
      for (const question of gameQuestions!) {
        const currentQuestion = createdQuestions.find(
          (q) => q.id === question.id,
        );
        if (!currentQuestion) {
          throw new Error(`Could not find question with ID ${question.id}`);
        }

        const response = await pairGamesTestManager.sendAnswer(
          user2Token,
          currentQuestion.correctAnswers[0],
        );
        expect(response.statusCode).toBe(HttpStatus.OK);
      }

      // Verify game is finished - use getPairGameById since the game is no longer "current"
      const currentGameResponse = await pairGamesTestManager.getPairGameById(
        user1Token,
        gameId,
      );
      expect(currentGameResponse.statusCode).toBe(HttpStatus.OK);
      expect(currentGameResponse.body.status).toBe(GameStatus.Finished);

      // Try to answer again
      const response = await pairGamesTestManager.sendAnswer(
        user1Token,
        'Any answer',
      );
      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
