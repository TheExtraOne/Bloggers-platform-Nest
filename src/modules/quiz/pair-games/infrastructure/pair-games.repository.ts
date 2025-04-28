import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, In, Repository } from 'typeorm';
import { GameStatus, PairGames } from '../domain/pair-game.entity';
import { LOCK_MODES } from '../../../../constants';

@Injectable()
export class PairGamesRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(PairGames)
    private readonly pairGamesRepository: Repository<PairGames>,
  ) {
    super();
  }

  async findPlayerPendingOrActiveGameByUserId(dto: {
    userId: string;
    manager?: EntityManager;
  }): Promise<PairGames | null> {
    if (!this.isCorrectNumber(dto.userId)) {
      return null;
    }

    const repo =
      dto.manager?.getRepository(PairGames) || this.pairGamesRepository;
    return repo.findOne({
      where: [
        {
          firstPlayerProgress: { user: { id: +dto.userId } },
          status: In([GameStatus.PendingSecondPlayer, GameStatus.Active]),
        },
        {
          secondPlayerProgress: { user: { id: +dto.userId } },
          status: In([GameStatus.PendingSecondPlayer, GameStatus.Active]),
        },
      ],
      relations: [
        'firstPlayerProgress',
        'secondPlayerProgress',
        'firstPlayerProgress.user',
        'secondPlayerProgress.user',
      ],
    });
  }

  async findPlayerActiveGameByUserId(dto: {
    userId: string;
    manager?: EntityManager;
  }): Promise<PairGames | null> {
    if (!this.isCorrectNumber(dto.userId)) {
      return null;
    }

    const repo =
      dto.manager?.getRepository(PairGames) || this.pairGamesRepository;
    return repo.findOne({
      where: [
        {
          firstPlayerProgress: { user: { id: +dto.userId } },
          status: GameStatus.Active,
        },
        {
          secondPlayerProgress: { user: { id: +dto.userId } },
          status: GameStatus.Active,
        },
      ],
      relations: [
        'firstPlayerProgress',
        'secondPlayerProgress',
        'firstPlayerProgress.user',
        'secondPlayerProgress.user',
      ],
    });
  }

  async findOpenGame(dto: {
    userId: string;
    manager: EntityManager;
    lockMode: LOCK_MODES;
  }): Promise<PairGames | null> {
    return await dto.manager
      .getRepository(PairGames)
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
      .leftJoinAndSelect('firstPlayerProgress.user', 'firstPlayerUser')
      .where('game.status = :status', {
        status: GameStatus.PendingSecondPlayer,
      })
      .andWhere('game.secondPlayerProgress IS NULL')
      .andWhere('firstPlayerUser.id != :userId', { userId: +dto.userId })
      .andWhere('game.deletedAt IS NULL')
      .setLock(dto.lockMode)
      .getOne();
  }

  async findGameById(
    id: string,
    manager?: EntityManager,
  ): Promise<PairGames | null> {
    if (!this.isCorrectNumber(id)) {
      return null;
    }

    const repo = manager?.getRepository(PairGames) || this.pairGamesRepository;
    return repo.findOne({
      where: { id: +id },
      relations: [
        'firstPlayerProgress',
        'secondPlayerProgress',
        'firstPlayerProgress.user',
        'secondPlayerProgress.user',
        'firstPlayerProgress.answers',
        'secondPlayerProgress.answers',
      ],
    });
  }

  async save(newGame: PairGames, manager?: EntityManager): Promise<PairGames> {
    if (manager) {
      return await manager.save(PairGames, newGame);
    }
    return await this.pairGamesRepository.save(newGame);
  }
}
