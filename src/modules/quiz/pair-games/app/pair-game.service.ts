import { Injectable } from '@nestjs/common';
import { PairViewDto } from '../api/view-dto/game-pair.view-dto';

@Injectable()
export class PairGameService {
  constructor() {}

  userIsParticipatingInTheGame(userId: string, game: PairViewDto) {
    return (
      game.firstPlayerProgress.player.id === userId ||
      game.secondPlayerProgress?.player?.id === userId
    );
  }
}
