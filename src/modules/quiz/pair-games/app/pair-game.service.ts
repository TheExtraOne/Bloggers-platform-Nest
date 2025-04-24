import { ForbiddenException, Injectable } from '@nestjs/common';
import { PairViewDto } from '../api/view-dto/game-pair.view-dto';

@Injectable()
export class PairGameService {
  constructor() {}

  async userIsParticipatingInTheGame(userId: string, game: PairViewDto) {
    if (
      game.firstPlayerProgress.player.id === userId ||
      game.secondPlayerProgress?.player?.id === userId
    ) {
      return true;
    }
    throw new ForbiddenException();
  }
}
