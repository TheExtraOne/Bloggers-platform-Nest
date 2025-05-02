import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import {
  GameStatus,
  PairGames,
} from '../../../pair-games/domain/pair-game.entity';
import { PairGamesRepository } from '../../../pair-games/infrastructure/pair-games.repository';
import { PgQuestionsRepository } from '../../../questions/infrastructure/pg.questions.repository';
import { Questions } from '../../../questions/domain/question.entity';
import {
  PlayerProgress,
  PlayerProgressStatus,
} from '../../../player-progress/domain/player-progress.entity';
import { PlayerProgressRepository } from '../../../player-progress/infrastructure/player-progress.repository';
import { Answers, AnswerStatus } from '../../domain/answers.entity';
import { AnswerRepository } from '../../infrastructure/answer.repository';
import { DataSource, EntityManager } from 'typeorm';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { LOCK_MODES } from '../../../../../constants';

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
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
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
    if (this.isGameFinished(game)) {
      await this.finishGame(game, manager);
    }

    return { answerId: answer.id.toString() };
  }

  private isGameFinished(game: PairGames): boolean {
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
    const playerProgressId =
      activePair[
        isUserFirstPlayer ? PlayerProgressType.First : PlayerProgressType.Second
      ]!.id;

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

  private async finishGame(game: PairGames, manager: EntityManager) {
    // Fetch latest answers, sorted
    const allAnswers = await manager.getRepository(Answers).find({
      where: { pairGame: { id: game.id } },
      order: { createdAt: 'ASC' },
      relations: ['playerProgress'],
    });

    const { firstPlayerAnswers, secondPlayerAnswers } = allAnswers.reduce(
      (acc, answer) => {
        if (answer.playerProgress.id === game.firstPlayerProgress.id) {
          acc.firstPlayerAnswers.push(answer);
        } else if (answer.playerProgress.id === game.secondPlayerProgress!.id) {
          acc.secondPlayerAnswers.push(answer);
        }
        return acc;
      },
      {
        firstPlayerAnswers: [] as Answers[],
        secondPlayerAnswers: [] as Answers[],
      },
    );

    const lastAnswerOfFirstPlayer =
      firstPlayerAnswers[firstPlayerAnswers.length - 1];
    const lastAnswerOfSecondPlayer =
      secondPlayerAnswers[secondPlayerAnswers.length - 1];

    const firstFinisher: PlayerProgressType =
      lastAnswerOfFirstPlayer.createdAt > lastAnswerOfSecondPlayer.createdAt
        ? PlayerProgressType.Second
        : PlayerProgressType.First;

    game.status = GameStatus.Finished;
    game.finishGameDate = new Date();

    // Add bonus point for first finisher if he had at least one correct answer
    const answersToCheck =
      firstFinisher === PlayerProgressType.First
        ? firstPlayerAnswers
        : secondPlayerAnswers;
    if (answersToCheck.some((a) => a.answerStatus === AnswerStatus.Correct)) {
      game[firstFinisher]!.score += 1;
    }

    this.setGameStatuses(game);

    await this.pairGamesRepository.save(game, manager);
  }

  private setGameStatuses(game: PairGames) {
    const firstPlayerScore = game.firstPlayerProgress.score;
    const secondPlayerScore = game.secondPlayerProgress!.score;

    if (firstPlayerScore > secondPlayerScore) {
      game.firstPlayerProgress.status = PlayerProgressStatus.Win;
      game.secondPlayerProgress!.status = PlayerProgressStatus.Lose;
    } else if (secondPlayerScore > firstPlayerScore) {
      game.firstPlayerProgress.status = PlayerProgressStatus.Lose;
      game.secondPlayerProgress!.status = PlayerProgressStatus.Win;
    } else {
      game.firstPlayerProgress.status = PlayerProgressStatus.Draw;
      game.secondPlayerProgress!.status = PlayerProgressStatus.Draw;
    }
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
    const currentQuestionId =
      activePair[
        isUserFirstPlayer ? PlayerProgressType.First : PlayerProgressType.Second
      ]?.currentQuestionId;

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
