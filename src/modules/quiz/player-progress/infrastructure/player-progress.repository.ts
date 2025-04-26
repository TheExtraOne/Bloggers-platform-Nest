import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, Repository } from 'typeorm';
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
    manager?: EntityManager;
  }): Promise<PlayerProgress> {
    if (!this.isCorrectNumber(dto.playerProgressId)) {
      throw new NotFoundException(ERRORS.PLAYER_PROGRESS_NOT_FOUND);
    }

    const repo = dto.manager?.getRepository(PlayerProgress) || this.playerProgressRepository;
    const playerProgress: PlayerProgress | null = await repo.findOne({
      where: { id: +dto.playerProgressId },
    });

    if (!playerProgress) {
      throw new NotFoundException(ERRORS.PLAYER_PROGRESS_NOT_FOUND);
    }
    return playerProgress;
  }

  async save(playerProgress: PlayerProgress, manager?: EntityManager): Promise<PlayerProgress> {
    if (manager) {
      return await manager.save(PlayerProgress, playerProgress);
    }
    return await this.playerProgressRepository.save(playerProgress);
  }
}
