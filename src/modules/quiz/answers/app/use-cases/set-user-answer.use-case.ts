import {
  Command,
  CommandHandler,
  ICommandHandler,
  CommandBus,
} from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { PairGames } from '../../../pair-games/domain/pair-game.entity';
import { PairGamesRepository } from '../../../pair-games/infrastructure/pair-games.repository';
import { PgQuestionsRepository } from '../../../questions/infrastructure/pg.questions.repository';
import { Questions } from '../../../questions/domain/question.entity';
import { PlayerProgress } from '../../../player-progress/domain/player-progress.entity';
import { PlayerProgressRepository } from '../../../player-progress/infrastructure/player-progress.repository';
import { Answers, AnswerStatus } from '../../domain/answers.entity';
import { AnswerRepository } from '../../infrastructure/answer.repository';
import { DataSource, EntityManager } from 'typeorm';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { LOCK_MODES } from '../../../../../constants';
import { PlayerCompletedGameEvent } from '../events/player-completed-game.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CompleteGameCommand } from '../../../pair-games/app/use-cases/complete-game.use-case';

enum PlayerProgressType {
  First = 'firstPlayerProgress',
  Second = 'secondPlayerProgress',
}

export class SetUserAnswerCommand extends Command<{ answerId: string }> {
  constructor(public readonly dto: { userId: string; answerBody: string }) {
    super();
  }
}

@CommandHandler(SetUserAnswerCommand)
export class SetUserAnswerUseCase
  extends AbstractTransactionalUseCase<
    SetUserAnswerCommand,
    { answerId: string }
  >
  implements ICommandHandler<SetUserAnswerCommand>
{
  constructor(
    private readonly pairGamesRepository: PairGamesRepository,
    private readonly questionsRepository: PgQuestionsRepository,
    private readonly playerProgressRepository: PlayerProgressRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly commandBus: CommandBus,
    protected readonly dataSource: DataSource,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super(dataSource, eventEmitter);
  }

  protected async executeInTransaction(
    command: SetUserAnswerCommand,
    manager: EntityManager,
  ): Promise<{ answerId: string }> {
    const { userId, answerBody } = command.dto;

    // 1. Get active game and validate participation
    const activePair = await this.findActiveGame(userId, manager);
    const { isUserFirstPlayer, currentQuestionId } =
      this.validateUserParticipation(activePair, userId);

    // 2. Get current question and validate answer
    const currentQuestion = await this.findCurrentQuestion(
      currentQuestionId,
      manager,
    );
    const isCorrectAnswer = this.validateAnswer(currentQuestion, answerBody);

    // 3. Update player progress
    const playerProgress = await this.updatePlayerProgress(
      activePair,
      isUserFirstPlayer,
      isCorrectAnswer,
      currentQuestionId,
      manager,
    );

    // 4. Save answer
    const answer = await this.createAnswer({
      answerBody,
      isCorrectAnswer,
      playerProgress,
      activePair,
      currentQuestion,
      manager,
    });

    // 5. Check and handle game finish
    const game = (await this.pairGamesRepository.findGameById(
      activePair.id.toString(),
      manager,
      LOCK_MODES.PESSIMISTIC_WRITE,
    )) as PairGames;

    await this.handleGameCompletion(
      game,
      playerProgress,
      isUserFirstPlayer,
      manager,
    );

    return { answerId: answer.id.toString() };
  }

  private getPlayerProgressType(
    isUserFirstPlayer: boolean,
  ): PlayerProgressType {
    return isUserFirstPlayer
      ? PlayerProgressType.First
      : PlayerProgressType.Second;
  }

  private hasOnePlayerJustFinished(playerProgress: PlayerProgress): boolean {
    return playerProgress.currentQuestionId === null;
  }

  private hasBothPlayersFinished(game: PairGames): boolean {
    return (
      game.firstPlayerProgress!.currentQuestionId === null &&
      game.secondPlayerProgress!.currentQuestionId === null
    );
  }

  private async findActiveGame(
    userId: string,
    manager: EntityManager,
    lockMode?: LOCK_MODES,
  ): Promise<PairGames> {
    const activePair =
      await this.pairGamesRepository.findPlayerActiveGameByUserId({
        userId,
        manager,
        lockMode,
      });
    if (!activePair) {
      throw new ForbiddenException();
    }
    return activePair;
  }

  private async findCurrentQuestion(
    questionId: number,
    manager: EntityManager,
  ): Promise<Questions> {
    return await this.questionsRepository.findQuestionByIdOrThrow(
      questionId.toString(),
      manager,
    );
  }

  private validateAnswer(question: Questions, answerBody: string): boolean {
    return question.correctAnswers.some(
      (answer) => answer.toLowerCase() === answerBody.toLowerCase(),
    );
  }

  private async updatePlayerProgress(
    activePair: PairGames,
    isUserFirstPlayer: boolean,
    isCorrectAnswer: boolean,
    currentQuestionId: number,
    manager: EntityManager,
  ): Promise<PlayerProgress> {
    const playerProgressType = this.getPlayerProgressType(isUserFirstPlayer);
    const playerProgressId = activePair[playerProgressType]!.id;

    const playerProgress =
      await this.playerProgressRepository.findPlayerProgressByIdOrThrow({
        playerProgressId: playerProgressId.toString(),
        manager,
      });

    playerProgress.score += isCorrectAnswer ? 1 : 0;
    playerProgress.currentQuestionId = this.getNextQuestionId(
      activePair,
      currentQuestionId,
    );

    return await this.playerProgressRepository.save(playerProgress, manager);
  }

  private async createAnswer({
    answerBody,
    isCorrectAnswer,
    playerProgress,
    activePair,
    currentQuestion,
    manager,
  }: {
    answerBody: string;
    isCorrectAnswer: boolean;
    playerProgress: PlayerProgress;
    activePair: PairGames;
    currentQuestion: Questions;
    manager: EntityManager;
  }): Promise<Answers> {
    const newAnswer = new Answers();
    newAnswer.answerBody = answerBody;
    newAnswer.answerStatus = isCorrectAnswer
      ? AnswerStatus.Correct
      : AnswerStatus.Incorrect;
    newAnswer.playerProgress = playerProgress;
    newAnswer.pairGame = activePair;
    newAnswer.question = currentQuestion;

    return this.answerRepository.save(newAnswer, manager);
  }

  private async handleGameCompletion(
    game: PairGames,
    playerProgress: PlayerProgress,
    isUserFirstPlayer: boolean,
    manager: EntityManager,
  ): Promise<void> {
    if (this.hasOnePlayerJustFinished(playerProgress)) {
      await this.addBonusPointToFirstFinishedPlayer(
        game,
        manager,
        playerProgress.id.toString(),
        isUserFirstPlayer,
      );

      // Add pending event with 10 seconds delay
      this.addPendingEvent(
        new PlayerCompletedGameEvent(game.id.toString()),
        10000,
      );
    }

    if (this.hasBothPlayersFinished(game)) {
      await this.finishGame(game, manager);
    }
  }

  private async addBonusPointToFirstFinishedPlayer(
    game: PairGames,
    manager: EntityManager,
    playerProgressId: string,
    isUserFirstPlayer: boolean,
  ): Promise<void> {
    const answers = await this.answerRepository.findPlayerAnswersInGame(
      game.id.toString(),
      playerProgressId,
      manager,
    );

    if (this.hasAtLeastOneCorrectAnswer(answers)) {
      await this.incrementPlayerScore(game, isUserFirstPlayer, manager);
    }
  }

  private hasAtLeastOneCorrectAnswer(answers: Answers[]): boolean {
    return answers.some(
      (answer) => answer.answerStatus === AnswerStatus.Correct,
    );
  }

  private async incrementPlayerScore(
    game: PairGames,
    isUserFirstPlayer: boolean,
    manager: EntityManager,
  ): Promise<void> {
    const playerProgressType = this.getPlayerProgressType(isUserFirstPlayer);
    const playerProgress = game[playerProgressType]!;
    playerProgress.score += 1;
    await this.playerProgressRepository.save(playerProgress, manager);
  }

  private async finishGame(game: PairGames, manager: EntityManager) {
    await this.commandBus.execute(new CompleteGameCommand(game, manager));
  }

  private validateUserParticipation(
    activePair: PairGames,
    userId: string,
  ): {
    isUserFirstPlayer: boolean;
    currentQuestionId: number;
  } {
    const isUserFirstPlayer =
      activePair.firstPlayerProgress.user.id === +userId;
    const playerProgressType = this.getPlayerProgressType(isUserFirstPlayer);
    const currentQuestionId = activePair[playerProgressType]?.currentQuestionId;

    // If currentQuestionId is null, then it was the last question in the game for current user
    if (!currentQuestionId) {
      throw new ForbiddenException();
    }

    return { isUserFirstPlayer, currentQuestionId };
  }

  private getNextQuestionId(
    activePair: PairGames,
    currentQuestionId: number,
  ): number | null {
    const currentIndex = activePair.questions!.findIndex(
      (question) => question.id === currentQuestionId.toString(),
    );

    const isLastQuestion = currentIndex === activePair.questions!.length - 1;
    if (isLastQuestion) {
      return null;
    }

    return +activePair.questions![currentIndex + 1].id;
  }
}
