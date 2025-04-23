import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from 'src/constants';
import { PairViewDto } from '../../api/view-dto/game-pair.view-dto';

@Injectable()
export class PairGamesQueryRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async getPairGameByIdOrThrowError(id: string): Promise<PairViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.GAME_NOT_FOUND);
    }

    const querySQL = `
      WITH game AS (
        SELECT pg.id, pg.questions, pg.status, pg.created_at, pg."start_game_date", pg."finish_game_date",
        fp."user_id" AS "first_player_id", fp."score" AS "first_player_score",
        u1.login AS "first_player_login", 
        sp."user_id" AS "second_player_id", sp."score" AS "second_player_score",
        u2.login AS "second_player_login"
        FROM pair_games as pg
        LEFT JOIN player_progress as fp ON pg.first_player_progress_id = fp.id
        LEFT JOIN users AS u1 ON fp."user_id" = u1.id
        LEFT JOIN player_progress as sp ON pg.second_player_progress_id = sp.id
        LEFT JOIN users AS u2 ON sp."user_id" = u2.id
        WHERE pg.id = $1 AND pg.deleted_at IS NULL
      )
      SELECT 
        game.id::text as id,
        game.questions,
        game.status,
        game.created_at AS "pairCreatedDate",
        game."start_game_date" AS "startGameDate",
        game."finish_game_date" AS "finishGameDate",
        json_build_object(
          'player', json_build_object (
            'userId', game."first_player_id"::text,
            'login', game."first_player_login"
          ),
          'score', game."first_player_score"
        ) AS "firstPlayerProgress",
        CASE 
          WHEN game."second_player_id" IS NULL
            THEN NULL
          ELSE
            json_build_object(
              'player', json_build_object (
                'userId', game."second_player_id"::text,
                'login', game."second_player_login"
              ),
              'score', game."second_player_score"
            )
        END AS "secondPlayerProgress"
      FROM game
      `;
    const params = [+id];
    const pairGame: PairViewDto[] = await this.dataSource.query(
      querySQL,
      params,
    );
    if (!pairGame[0]) throw new NotFoundException(ERRORS.GAME_NOT_FOUND);

    return pairGame[0];
  }
}
