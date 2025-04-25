import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import {
  GameStatus,
  PairGames,
} from '../../../pair-games/domain/pair-game.entity';
import { PairGamesRepository } from '../../../pair-games/infrastructure/pair-games.repository';
import { PgQuestionsRepository } from '../../../questions/infrastructure/pg.questions.repository';
import { Questions } from '../../../questions/domain/question.entity';
import { PlayerProgressRepository } from '../../../player-progress/infrastructure/player-progress.repository';
import { Answers, AnswerStatus } from '../../domain/answers.entity';
import { AnswerRepository } from '../../infrastructure/answer.repository';
import { PlayerProgress } from '../../../player-progress/domain/player-progress.entity';

export class SetUserAnswerCommand extends Command<{ answerId: string }> {
  constructor(public readonly dto: { userId: string; answerBody: string }) {
    super();
  }
}

@CommandHandler(SetUserAnswerCommand)
export class SetUserAnswerUseCase
  implements ICommandHandler<SetUserAnswerCommand>
{
  constructor(
    private readonly pairGamesRepository: PairGamesRepository,
    private readonly questionsRepository: PgQuestionsRepository,
    private readonly playerProgressRepository: PlayerProgressRepository,
    private readonly answerRepository: AnswerRepository,
  ) {}

  // TODO: refactor, wrap with transaction
  async execute(command: SetUserAnswerCommand) {
    const { userId, answerBody } = command.dto;

    const activePair = await this.getActiveGameOrThrowByUserId(userId);
    const { isUserFirstPlayer, currentQuestionId } =
      this.validateUserParticipation(activePair, userId);

    const currentQuestion =
      await this.questionsRepository.findQuestionByIdOrThrow(
        currentQuestionId.toString(),
      );

    const isCorrectAnswer = this.validateAnswer({
      currentQuestion,
      answerBody,
    });

    const playerProgress = await this.updatePlayerProgress(
      activePair,
      isUserFirstPlayer,
      isCorrectAnswer,
      currentQuestionId,
    );

    const savedAnswer = await this.createAnswer({
      answerBody,
      isCorrectAnswer,
      playerProgress,
      activePair,
      currentQuestion,
    });

    // TODO: refactor, split
    const updatedGame = await this.pairGamesRepository.findGameById(
      activePair.id.toString(),
    );

    // Check if the game is finished
    const isGameFinished =
      updatedGame!.firstPlayerProgress!.currentQuestionId === null &&
      updatedGame!.secondPlayerProgress!.currentQuestionId === null;
    if (isGameFinished) {
      const lastAnswerIndex =
        updatedGame!.firstPlayerProgress!.answers!.length - 1;

      const firstFinishedPlayer =
        updatedGame!.firstPlayerProgress?.answers![lastAnswerIndex].createdAt >
        (updatedGame?.secondPlayerProgress?.answers?.[lastAnswerIndex]
          ?.createdAt as unknown as Date)
          ? 'secondPlayerProgress'
          : 'firstPlayerProgress';
      console.log('firstFinishedPlayer', firstFinishedPlayer);

      const shouldAddPoints = updatedGame![firstFinishedPlayer]!.answers!.some(
        (answer) => answer.answerStatus === AnswerStatus.Correct,
      );

      updatedGame!.status = GameStatus.Finished;
      updatedGame!.finishGameDate = new Date();

      if (shouldAddPoints) {
        updatedGame![firstFinishedPlayer]!.score += 1;
      }
      await this.pairGamesRepository.save(updatedGame!);
    }

    return { answerId: savedAnswer.id.toString() };
  }

  private async getActiveGameOrThrowByUserId(
    userId: string,
  ): Promise<PairGames> {
    const activePair: PairGames | null =
      await this.pairGamesRepository.findPlayerActiveGameByUserId({
        userId,
      });

    if (!activePair) {
      throw new ForbiddenException();
    }

    return activePair;
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
        isUserFirstPlayer ? 'firstPlayerProgress' : 'secondPlayerProgress'
      ]?.currentQuestionId;

    // If currentQuestionId is null, then it was the last question in the game for current user
    if (!currentQuestionId) {
      throw new ForbiddenException();
    }

    return { isUserFirstPlayer, currentQuestionId };
  }

  private async updatePlayerProgress(
    activePair: PairGames,
    isUserFirstPlayer: boolean,
    isCorrectAnswer: boolean,
    currentQuestionId: number,
  ): Promise<PlayerProgress> {
    const playerProgressId =
      activePair[
        isUserFirstPlayer ? 'firstPlayerProgress' : 'secondPlayerProgress'
      ]!.id;

    const playerProgress =
      await this.playerProgressRepository.findPlayerProgressByIdOrThrow({
        playerProgressId: playerProgressId.toString(),
      });

    playerProgress.score += isCorrectAnswer ? 1 : 0;

    const nextQuestionId = this.getNextQuestionId(
      activePair,
      currentQuestionId,
    );
    playerProgress.currentQuestionId = nextQuestionId;

    return await this.playerProgressRepository.save(playerProgress);
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

  private async createAnswer({
    answerBody,
    isCorrectAnswer,
    playerProgress,
    activePair,
    currentQuestion,
  }: {
    answerBody: string;
    isCorrectAnswer: boolean;
    playerProgress: PlayerProgress;
    activePair: PairGames;
    currentQuestion: Questions;
  }): Promise<Answers> {
    const newAnswer = new Answers();
    newAnswer.answerBody = answerBody;
    newAnswer.answerStatus = isCorrectAnswer
      ? AnswerStatus.Correct
      : AnswerStatus.Incorrect;
    newAnswer.playerProgress = playerProgress;
    newAnswer.pairGame = activePair;
    newAnswer.question = currentQuestion;

    return this.answerRepository.save(newAnswer);
  }

  private validateAnswer({
    currentQuestion,
    answerBody,
  }: {
    currentQuestion: Questions;
    answerBody: string;
  }) {
    return !!currentQuestion.correctAnswers.find(
      (ans) => ans.toLowerCase() === answerBody.toLowerCase(),
    );
  }
}
