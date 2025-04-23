import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { PairViewDto } from '../../../src/modules/quiz/pair-games/api/view-dto/game-pair.view-dto';
import { INestApplication } from '@nestjs/common';

export class PairGamesTestManager {
  constructor(private app: INestApplication) {}

  async connectUser(accessToken: string): Promise<{
    statusCode: number;
    body: PairViewDto;
  }> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.PAIR_GAME_QUIZ}/connection`)
      .set('Authorization', `Bearer ${accessToken}`);

    return {
      statusCode: response.status,
      body: response.body,
    };
  }
}
