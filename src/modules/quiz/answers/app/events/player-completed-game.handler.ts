import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { PlayerCompletedGameEvent } from './player-completed-game.event';
import { CommandBus } from '@nestjs/cqrs';
import { CompleteGameCommand } from '../../../pair-games/app/use-cases/complete-game.use-case';
import { PairGamesRepository } from '../../../pair-games/infrastructure/pair-games.repository';

@Injectable()
export class PlayerCompletedGameHandler {
  constructor(
    private readonly dataSource: DataSource,
    private readonly commandBus: CommandBus,
    private readonly pairGamesRepository: PairGamesRepository,
  ) {}

  @OnEvent('PlayerCompletedGameEvent')
  async handlePlayerCompletedGame(event: PlayerCompletedGameEvent) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the game is still active
      const game = await this.pairGamesRepository.findActiveGameById({
        gameId: +event.gameId,
        manager: queryRunner.manager,
      });

      if (!game) {
        // Game might have been finished by the other player
        await queryRunner.rollbackTransaction();
        return;
      }

      await this.commandBus.execute(
        new CompleteGameCommand(game, queryRunner.manager),
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Failed to handle player completed game event', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
