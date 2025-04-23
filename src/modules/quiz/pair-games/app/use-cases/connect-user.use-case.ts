import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGamesRepository } from '../../infrastructure/pair-games.repository';
import { ForbiddenException } from '@nestjs/common';
import { PairGames } from '../../domain/pair-game.entity';

export class ConnectUserCommand extends Command<{ pairGameId: string }> {
  constructor(public readonly dto: { userId: string }) {
    super();
  }
}

@CommandHandler(ConnectUserCommand)
export class ConnectUserUseCase implements ICommandHandler<ConnectUserCommand> {
  constructor(private readonly pairGamesRepository: PairGamesRepository) {}

  async execute(command: ConnectUserCommand) {
    const { userId } = command.dto;

    // Check if current user is already participating in active pair
    const activePair: PairGames | null =
      await this.pairGamesRepository.findPlayerActiveGameByUserId({
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
    return await this.pairGamesRepository.createPairGame({ userId });
  }
}
