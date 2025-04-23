import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { In, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { GameStatus, PairGames } from '../domain/pair-game.entity';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { PgExternalUsersRepository } from '../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { Users } from '../../../user-accounts/users/domain/entities/user.entity';
import { PgQuestionsRepository } from '../../questions/infrastructure/pg.questions.repository';

@Injectable()
export class PairGamesRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(PairGames)
    private readonly pairGamesRepository: Repository<PairGames>,
    private readonly pgExternalUsersRepository: PgExternalUsersRepository,
    private readonly dataSource: DataSource,
    private readonly pgQuestionsRepository: PgQuestionsRepository,
  ) {
    super();
  }

  async createPairGame(dto: {
    userId: string;
  }): Promise<{ pairGameId: string }> {
    const user: Users = await this.pgExternalUsersRepository.findUserOrThrow(
      dto.userId,
    );

    const firstPlayerProgress = new PlayerProgress();
    firstPlayerProgress.user = user;

    const newGame = new PairGames();
    newGame.firstPlayerProgress = firstPlayerProgress;
    newGame.secondPlayerProgress = null;
    newGame.questions = null;

    await this.pairGamesRepository.save(newGame);

    return { pairGameId: newGame.id.toString() };
  }

  async findPlayerActiveGameByUserId(dto: {
    userId: string;
  }): Promise<PairGames | null> {
    return this.pairGamesRepository.findOne({
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
      relations: ['firstPlayerProgress', 'secondPlayerProgress'],
    });
  }

  async findAndJoinToOpenGame(dto: {
    userId: string;
  }): Promise<{ pairGameId: string } | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user: Users = await this.pgExternalUsersRepository.findUserOrThrow(
        dto.userId,
      );

      // Lock and get an open game with no second player (other than yourself)
      const openGame = await queryRunner.manager
        .createQueryBuilder(PairGames, 'game')
        .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
        .leftJoinAndSelect('firstPlayerProgress.user', 'firstPlayerUser')
        .where('game.status = :status', {
          status: GameStatus.PendingSecondPlayer,
        })
        .andWhere('game.secondPlayerProgress IS NULL')
        .andWhere('firstPlayerUser.id != :userId', { userId: +dto.userId })
        .andWhere('game.deletedAt IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!openGame) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      // Create and save (because of cascade: true) player progress
      const secondPlayerProgress = new PlayerProgress();
      secondPlayerProgress.user = user;

      openGame.status = GameStatus.Active;
      openGame.secondPlayerProgress = secondPlayerProgress;
      openGame.startGameDate = new Date();
      // Pick 5 random questions
      const questions1 = await this.pgQuestionsRepository.getRandomQuestions(5);
      openGame.questions = questions1;

      await queryRunner.manager.save(PairGames, openGame);

      await queryRunner.commitTransaction();
      return { pairGameId: openGame.id.toString() };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error joining open game:', error);
      return null;
    } finally {
      await queryRunner.release();
    }
  }
}
