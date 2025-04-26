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

@Injectable()
export class PairGamesQueryRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async getPairGameByIdOrThrowError(id: string): Promise<PairViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new BadRequestException(ERRORS.GAME_NOT_FOUND);
    }
    // TODO: check all the rest CTE

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
}
