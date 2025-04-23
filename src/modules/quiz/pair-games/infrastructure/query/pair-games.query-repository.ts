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
    // TODO: check all the rest CTE
    // TODO: add answers
    const querySQL = `
      WITH selected_game AS (
        SELECT *
        FROM pair_games
        WHERE id = $1 AND deleted_at IS NULL
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
            'userId', fp."user_id"::text,
            'login', u1.login
          ),
          'score', fp."score"
        ) AS "firstPlayerProgress",
        CASE 
          WHEN sp."user_id" IS NULL
            THEN NULL
          ELSE
            json_build_object(
              'player', json_build_object (
                'userId', sp."user_id"::text,
                'login', u2.login
              ),
              'score', sp."score"
            )
        END AS "secondPlayerProgress"
      FROM selected_game sg
      LEFT JOIN player_progress fp ON sg.first_player_progress_id = fp.id
      LEFT JOIN users u1 ON fp."user_id" = u1.id
      LEFT JOIN player_progress sp ON sg.second_player_progress_id = sp.id
      LEFT JOIN users u2 ON sp."user_id" = u2.id
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
