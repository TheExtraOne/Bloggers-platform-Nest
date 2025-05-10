import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGames, GameStatus } from '../../domain/pair-game.entity';
import { PlayerProgressStatus } from '../../../player-progress/domain/player-progress.entity';
import { PairGamesRepository } from '../../infrastructure/pair-games.repository';
import { EntityManager } from 'typeorm';

export class CompleteGameCommand {
  constructor(
    public readonly game: PairGames,
    public readonly manager: EntityManager,
  ) {}
}

@CommandHandler(CompleteGameCommand)
export class CompleteGameUseCase implements ICommandHandler<CompleteGameCommand> {
  constructor(private readonly pairGamesRepository: PairGamesRepository) {}

  async execute(command: CompleteGameCommand): Promise<void> {
    const { game, manager } = command;

    this.completeGame(game);
    await this.pairGamesRepository.save(game, manager);
  }

  private completeGame(game: PairGames): void {
    game.status = GameStatus.Finished;
    game.finishGameDate = new Date();
    game.secondPlayerProgress!.currentQuestionId = null;
    this.setGameStatusesInPlayerProgress(game);
  }

  private setGameStatusesInPlayerProgress(game: PairGames): void {
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
}
