import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGamesRepository } from '../../infrastructure/pair-games.repository';
import { ForbiddenException } from '@nestjs/common';
import { GameStatus, PairGames } from '../../domain/pair-game.entity';
import { PgExternalUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { PlayerProgress } from '../../../../quiz/player-progress/domain/player-progress.entity';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { LOCK_MODES } from '../../../../../constants';
import { PgQuestionsRepository } from '../../../questions/infrastructure/pg.questions.repository';

export class ConnectUserCommand extends Command<{ pairGameId: string }> {
  constructor(public readonly dto: { userId: string }) {
    super();
  }
}

@CommandHandler(ConnectUserCommand)
export class ConnectUserUseCase
  extends AbstractTransactionalUseCase<
    ConnectUserCommand,
    { pairGameId: string }
  >
  implements ICommandHandler<ConnectUserCommand>
{
  constructor(
    private readonly pairGamesRepository: PairGamesRepository,
    private readonly pgExternalUsersRepository: PgExternalUsersRepository,
    private readonly pgQuestionsRepository: PgQuestionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async executeInTransaction(
    command: ConnectUserCommand,
    manager: EntityManager,
  ) {
    const { userId } = command.dto;
    await this.checkIfUserIsAlreadyParticipatingAndThrowIfYes(userId);

    const joinedGameId: {
      pairGameId: string;
    } | null = await this.joinToOpenGameIfItExists(userId, manager);
    if (joinedGameId) {
      return joinedGameId;
    }

    const savedGame = await this.createNewGame(userId);
    return { pairGameId: savedGame.id.toString() };
  }

  private async checkIfUserIsAlreadyParticipatingAndThrowIfYes(
    userId: string,
  ): Promise<null> {
    // Check if current user is already participating in active pair
    const activePair: PairGames | null =
      await this.pairGamesRepository.findPlayerPendingOrActiveGameByUserId({
        userId,
      });
    if (activePair) {
      throw new ForbiddenException();
    }

    return activePair;
  }

  private async joinToOpenGameIfItExists(
    userId: string,
    manager: EntityManager,
  ): Promise<{
    pairGameId: string;
  } | null> {
    const openGame = await this.findOpenGame(userId, manager);
    if (!openGame) {
      return null;
    }

    const user = await this.pgExternalUsersRepository.findUserOrThrow(userId);
    const secondPlayerProgress = await this.setupSecondPlayer(openGame, user);
    await this.configureGameSettings(openGame);
    await this.setupGameQuestions(openGame, secondPlayerProgress);

    const savedGame = await this.pairGamesRepository.save(openGame, manager);

    return {
      pairGameId: savedGame.id.toString(),
    };
  }

  private async findOpenGame(
    userId: string,
    manager: EntityManager,
  ): Promise<PairGames | null> {
    return this.pairGamesRepository.findOpenGame({
      userId,
      manager,
      lockMode: LOCK_MODES.PESSIMISTIC_WRITE,
    });
  }

  private async setupSecondPlayer(
    openGame: PairGames,
    user: Users,
  ): Promise<PlayerProgress> {
    const secondPlayerProgress = new PlayerProgress();
    secondPlayerProgress.user = user;
    openGame.secondPlayerProgress = secondPlayerProgress;
    return secondPlayerProgress;
  }

  private async configureGameSettings(openGame: PairGames): Promise<void> {
    openGame.status = GameStatus.Active;
    openGame.startGameDate = new Date();
  }

  private async setupGameQuestions(
    openGame: PairGames,
    secondPlayerProgress: PlayerProgress,
  ): Promise<void> {
    const questions = await this.pgQuestionsRepository.getRandomQuestions(5);
    openGame.questions = questions;

    const currentQuestionId = +questions[0].id;
    secondPlayerProgress.currentQuestionId = currentQuestionId;
    openGame.firstPlayerProgress.currentQuestionId = currentQuestionId;
  }

  private async createNewGame(userId: string): Promise<PairGames> {
    // If no open game found, create a new one
    const user: Users =
      await this.pgExternalUsersRepository.findUserOrThrow(userId);

    const firstPlayerProgress = new PlayerProgress();
    firstPlayerProgress.user = user;

    const newGame = new PairGames();
    newGame.firstPlayerProgress = firstPlayerProgress;
    newGame.secondPlayerProgress = null;
    newGame.questions = null;

    return await this.pairGamesRepository.save(newGame);
  }
}
