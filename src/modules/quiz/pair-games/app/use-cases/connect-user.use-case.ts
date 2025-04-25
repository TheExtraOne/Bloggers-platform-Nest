import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGamesRepository } from '../../infrastructure/pair-games.repository';
import { ForbiddenException } from '@nestjs/common';
import { PairGames } from '../../domain/pair-game.entity';
import { PgExternalUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { PlayerProgress } from '../../../../quiz/player-progress/domain/player-progress.entity';

export class ConnectUserCommand extends Command<{ pairGameId: string }> {
  constructor(public readonly dto: { userId: string }) {
    super();
  }
}

@CommandHandler(ConnectUserCommand)
export class ConnectUserUseCase implements ICommandHandler<ConnectUserCommand> {
  constructor(
    private readonly pairGamesRepository: PairGamesRepository,
    private readonly pgExternalUsersRepository: PgExternalUsersRepository,
  ) {}

  async execute(command: ConnectUserCommand) {
    const { userId } = command.dto;

    // Check if current user is already participating in active pair
    const activePair: PairGames | null =
      await this.pairGamesRepository.findPlayerPendingOrActiveGameByUserId({
        userId,
      });
    if (activePair) {
      throw new ForbiddenException();
    }

    // Try to join an existing open game first
    const joinedGame: {
      pairGameId: string;
    } | null = await this.pairGamesRepository.findAndJoinToOpenGame({
      userId,
    });
    if (joinedGame) {
      return joinedGame;
    }

    // If no open game found, create a new one
    const user: Users =
      await this.pgExternalUsersRepository.findUserOrThrow(userId);

    const firstPlayerProgress = new PlayerProgress();
    firstPlayerProgress.user = user;

    const newGame = new PairGames();
    newGame.firstPlayerProgress = firstPlayerProgress;
    newGame.secondPlayerProgress = null;
    newGame.questions = null;

    const savedGame = await this.pairGamesRepository.save(newGame);
    return { pairGameId: savedGame.id.toString() };
  }
}
