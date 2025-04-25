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

  async save(newGame: PairGames): Promise<PairGames> {
    return await this.pairGamesRepository.save(newGame);
  }

  async findPlayerPendingOrActiveGameByUserId(dto: {
    userId: string;
  }): Promise<PairGames | null> {
    if (!this.isCorrectNumber(dto.userId)) {
      return null;
    }
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
  }): Promise<PairGames | null> {
    if (!this.isCorrectNumber(dto.userId)) {
      return null;
    }
    return this.pairGamesRepository.findOne({
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

  // TODO: refactor, leave only save
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
      const questions = await this.pgQuestionsRepository.getRandomQuestions(5);
      openGame.questions = questions;

      // Set the first question for each player
      const currentQuestionId = +questions[0].id;
      secondPlayerProgress.currentQuestionId = currentQuestionId;
      openGame.firstPlayerProgress.currentQuestionId = currentQuestionId;

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

  async findGameById(id: string): Promise<PairGames | null> {
    if (!this.isCorrectNumber(id)) {
      return null;
    }
    return this.pairGamesRepository.findOne({
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
}
