import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { ERRORS } from '../../../../constants';

@Injectable()
export class PlayerProgressRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepository: Repository<PlayerProgress>,
  ) {
    super();
  }

  async findPlayerProgressByIdOrThrow(dto: {
    playerProgressId: string;
  }): Promise<PlayerProgress> {
    if (!this.isCorrectNumber(dto.playerProgressId)) {
      throw new NotFoundException(ERRORS.PLAYER_PROGRESS_NOT_FOUND);
    }

    const playerProgress: PlayerProgress | null =
      await this.playerProgressRepository.findOne({
        where: { id: +dto.playerProgressId },
      });

    if (!playerProgress) {
      throw new NotFoundException(ERRORS.PLAYER_PROGRESS_NOT_FOUND);
    }
    return playerProgress;
  }

  async save(playerProgress: PlayerProgress): Promise<PlayerProgress> {
    return await this.playerProgressRepository.save(playerProgress);
  }
}
