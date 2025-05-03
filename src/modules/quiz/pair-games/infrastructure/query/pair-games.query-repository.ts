import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from 'src/constants';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { GameStatus } from '../../domain/pair-game.entity';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetAllUserGamesQueryParams } from '../../api/input-dto/get-all-user-games.input-dto';
import { UserStatisticViewDto } from '../../api/view-dto/user-statistic.view-dto';
import { PlayerProgressStatus } from '../../../player-progress/domain/player-progress.entity';
import { GetTopUsersQueryParams } from '../../api/input-dto/get-top-users.input-dto';
import { TopUserViewDto } from '../../api/view-dto/top-user.view-dto';

@Injectable()
export class PairGamesQueryRepository extends PgBaseRepository {
  private readonly allowedColumns = [
    'pair_created_date',
    'start_game_date',
    'finish_game_date',
    'status',
  ] as const;
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async getPairGameByIdOrThrowError(id: string): Promise<PairViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new BadRequestException(ERRORS.GAME_NOT_FOUND);
    }

    const querySQL = `
      WITH selected_game AS (
        SELECT *
        FROM pair_games
        WHERE id = $1 AND deleted_at IS NULL
      ),
      answers_agg AS (
        SELECT
          player_progress_id,
          json_agg(json_build_object(
            'questionId', a.question_id::text,
            'answerStatus', a.answer_status,
            'addedAt', to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) ORDER BY a.created_at ASC) AS answers
        FROM answers a
        WHERE a.pair_game_id = $1 AND a.deleted_at IS NULL
        GROUP BY player_progress_id
      )
      SELECT 
        sg.id::text as id,
        sg.questions,
        sg.status,
        sg.created_at AS "pairCreatedDate",
        sg."start_game_date" AS "startGameDate",
        sg."finish_game_date" AS "finishGameDate",
        json_build_object(
          'player', json_build_object (
            'id', fp."user_id"::text,
            'login', u1.login
          ),
          'score', fp."score",
          'answers', COALESCE(fa.answers, '[]')
        ) AS "firstPlayerProgress",
        CASE 
          WHEN sp."user_id" IS NULL
            THEN NULL
          ELSE
            json_build_object(
              'player', json_build_object (
                'id', sp."user_id"::text,
                'login', u2.login
              ),
              'score', sp."score",
              'answers', COALESCE(sa.answers, '[]')
            )
        END AS "secondPlayerProgress"
      FROM selected_game sg
      LEFT JOIN player_progress fp ON sg.first_player_progress_id = fp.id
      LEFT JOIN users u1 ON fp."user_id" = u1.id
      LEFT JOIN answers_agg fa ON fa.player_progress_id = fp.id
      LEFT JOIN player_progress sp ON sg.second_player_progress_id = sp.id
      LEFT JOIN users u2 ON sp."user_id" = u2.id
      LEFT JOIN answers_agg sa ON sa.player_progress_id = sp.id
      `;
    const params = [+id];
    const pairGame: PairViewDto[] = await this.dataSource.query(
      querySQL,
      params,
    );
    if (!pairGame[0]) throw new NotFoundException(ERRORS.GAME_NOT_FOUND);

    const game: PairViewDto = pairGame[0];
    return game;
  }

  async getActivePairGameByUserIdOrThrowError(
    userId: string,
  ): Promise<PairViewDto> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const querySQL = `
      WITH selected_game AS (
        SELECT *
        FROM pair_games
        WHERE status = ANY($2)
          AND deleted_at IS NULL
          AND (
            first_player_progress_id IN (
              SELECT id FROM player_progress WHERE user_id = $1
            )
            OR
            second_player_progress_id IN (
              SELECT id FROM player_progress WHERE user_id = $1
            )
          )
        LIMIT 1
      ),
      answers_agg AS (
        SELECT
          player_progress_id,
          json_agg(json_build_object(
            'questionId', a.question_id::text,
            'answerStatus', a.answer_status,
            'addedAt', to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) ORDER BY a.created_at ASC) AS answers
        FROM answers a
        WHERE a.pair_game_id = (SELECT id FROM selected_game) AND a.deleted_at IS NULL
        GROUP BY player_progress_id
      )
      SELECT 
        sg.id::text as id,
        sg.questions,
        sg.status,
        sg.created_at AS "pairCreatedDate",
        sg."start_game_date" AS "startGameDate",
        sg."finish_game_date" AS "finishGameDate",
        json_build_object(
          'player', json_build_object (
            'id', fp."user_id"::text,
            'login', u1.login
          ),
          'score', fp."score",
          'answers', COALESCE(fa.answers, '[]')
        ) AS "firstPlayerProgress",
        CASE 
          WHEN sp."user_id" IS NULL
            THEN NULL
          ELSE
            json_build_object(
              'player', json_build_object (
                'id', sp."user_id"::text,
                'login', u2.login
              ),
              'score', sp."score",
              'answers', COALESCE(sa.answers, '[]')
            )
        END AS "secondPlayerProgress"
      FROM selected_game sg
      LEFT JOIN player_progress fp ON sg.first_player_progress_id = fp.id
      LEFT JOIN users u1 ON fp."user_id" = u1.id
      LEFT JOIN answers_agg fa ON fa.player_progress_id = fp.id
      LEFT JOIN player_progress sp ON sg.second_player_progress_id = sp.id
      LEFT JOIN users u2 ON sp."user_id" = u2.id
      LEFT JOIN answers_agg sa ON sa.player_progress_id = sp.id
    `;

    const params = [
      +userId,
      [GameStatus.Active, GameStatus.PendingSecondPlayer],
    ];
    const pairGame: PairViewDto[] = await this.dataSource.query(
      querySQL,
      params,
    );

    if (!pairGame[0]) throw new NotFoundException(ERRORS.GAME_NOT_FOUND);

    const game: PairViewDto = pairGame[0];
    return game;
  }

  async getAllGamesByUserId(
    userId: string,
    query: GetAllUserGamesQueryParams,
  ): Promise<PaginatedViewDto<PairViewDto[]>> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    const querySQL = `
      WITH selected_game AS (
        SELECT *
        FROM pair_games
        WHERE deleted_at IS NULL
          AND (
            first_player_progress_id IN (
              SELECT id FROM player_progress WHERE user_id = $1
            )
            OR
            second_player_progress_id IN (
              SELECT id FROM player_progress WHERE user_id = $1
            )
          )
      ),
      answers_agg AS (
        SELECT
          player_progress_id,
          json_agg(json_build_object(
            'questionId', a.question_id::text,
            'answerStatus', a.answer_status,
            'addedAt', to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) ORDER BY a.created_at ASC) AS answers
        FROM answers a
        LEFT JOIN selected_game sg ON a.pair_game_id = sg.id
        WHERE a.deleted_at IS NULL
        GROUP BY player_progress_id
      )
      SELECT 
        sg.id::text as id,
        sg.questions,
        sg.status,
        sg.created_at AS "pairCreatedDate",
        sg."start_game_date" AS "startGameDate",
        sg."finish_game_date" AS "finishGameDate",
        json_build_object(
          'player', json_build_object (
            'id', fp."user_id"::text,
            'login', u1.login
          ),
          'score', fp."score",
          'answers', COALESCE(fa.answers, '[]')
        ) AS "firstPlayerProgress",
        CASE 
          WHEN sp."user_id" IS NULL
            THEN NULL
          ELSE
            json_build_object(
              'player', json_build_object (
                'id', sp."user_id"::text,
                'login', u2.login
              ),
              'score', sp."score",
              'answers', COALESCE(sa.answers, '[]')
            )
        END AS "secondPlayerProgress"
      FROM selected_game sg
      LEFT JOIN player_progress fp ON sg.first_player_progress_id = fp.id
      LEFT JOIN users u1 ON fp."user_id" = u1.id
      LEFT JOIN answers_agg fa ON fa.player_progress_id = fp.id
      LEFT JOIN player_progress sp ON sg.second_player_progress_id = sp.id
      LEFT JOIN users u2 ON sp."user_id" = u2.id
      LEFT JOIN answers_agg sa ON sa.player_progress_id = sp.id
      ORDER BY sg.${sortColumn} ${upperCaseSortDirection}, sg.created_at DESC
      LIMIT $2
      OFFSET $3
    `;

    const params = [userId, limit, offset];
    const [totalCountResult, pairGame] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) FROM pair_games WHERE deleted_at IS NULL
            AND (
              first_player_progress_id IN (
                SELECT id FROM player_progress WHERE user_id = $1
              )
              OR
              second_player_progress_id IN (
                SELECT id FROM player_progress WHERE user_id = $1
              )
            )`,
        [userId],
      ),
      this.dataSource.query(querySQL, params),
    ]);

    const totalCount = totalCountResult[0].count;

    return PaginatedViewDto.mapToView({
      items: pairGame,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async getUserStatistic(userId: string): Promise<UserStatisticViewDto> {
    const querySQL = `
    SELECT COALESCE(SUM(p.score), 0)::integer AS "sumScore", 
      ROUND(COALESCE(AVG(p.score), 0), 2) AS "avgScores", 
      COUNT(*)::integer AS "gamesCount",
      COUNT(CASE WHEN p.status = $2 THEN 1 END)::integer AS "winsCount",
      COUNT(CASE WHEN p.status = $3 THEN 1 END)::integer AS "lossesCount",
      COUNT(CASE WHEN p.status = $4 THEN 1 END)::integer AS "drawsCount"
    FROM player_progress p
    WHERE p.user_id = $1;
  `;

    const params = [
      +userId,
      PlayerProgressStatus.Win,
      PlayerProgressStatus.Lose,
      PlayerProgressStatus.Draw,
    ];
    const userStatistics: UserStatisticViewDto[] = await this.dataSource.query(
      querySQL,
      params,
    );

    const userStatistic = userStatistics[0];

    return { ...userStatistic, avgScores: +userStatistic.avgScores };
  }

  async getTopUsers(
    query: GetTopUsersQueryParams,
  ): Promise<PaginatedViewDto<TopUserViewDto[]>> {
    const { pageNumber, pageSize, sort } = query;
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const querySQL = `
    SELECT 
      COALESCE(SUM(p.score), 0)::integer AS "sumScore", 
      ROUND(COALESCE(AVG(p.score), 0), 2)::float8 AS "avgScores", 
      COUNT(*)::integer AS "gamesCount",
      COUNT(CASE WHEN p.status = 'Win' THEN 1 END)::integer AS "winsCount",
      COUNT(CASE WHEN p.status = 'Lose' THEN 1 END)::integer AS "lossesCount",
      COUNT(CASE WHEN p.status = 'Draw' THEN 1 END)::integer AS "drawsCount",
      json_build_object('id', (p.user_id)::text, 'login', u.login) AS "player"
    FROM player_progress p
    LEFT JOIN users u ON u.id = p.user_id
    GROUP BY p.user_id, u.login
    ORDER BY ${sort.map((x) => `"${x.split(' ')[0]}" ${x.split(' ')[1]}`).join(', ')}
    LIMIT $1
    OFFSET $2;
    `;
    const params = [limit, offset];
    const [topUsers, totalCountResult]: [
      TopUserViewDto[],
      [{ count: string }],
    ] = await Promise.all([
      this.dataSource.query(querySQL, params),
      this.dataSource.query(
        `SELECT COUNT(DISTINCT user_id)::integer FROM player_progress;`,
      ),
    ]);

    const totalCount = +totalCountResult[0].count;

    return PaginatedViewDto.mapToView({
      items: topUsers,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  protected getSortColumn(
    sortBy: string,
    allowedColumns: readonly string[],
  ): string {
    const snakeCase: string = super.getSortColumn(sortBy, allowedColumns);
    return snakeCase === 'pair_created_date' ? 'created_at' : snakeCase;
  }
}
