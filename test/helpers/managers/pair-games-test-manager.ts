import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { PairViewDto } from '../../../src/modules/quiz/pair-games/api/view-dto/game-pair.view-dto';
import { INestApplication } from '@nestjs/common';
import { AnswerViewDto } from '../../../src/modules/quiz/answers/api/view-dto/answer.view-dto';

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

  async sendAnswer(
    accessToken: string,
    answer: string,
  ): Promise<{
    statusCode: number;
    body: AnswerViewDto;
  }> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.PAIR_GAME_QUIZ}/my-current/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answer });

    return {
      statusCode: response.status,
      body: response.body,
    };
  }

  async getPairGameById(
    accessToken: string,
    gameId: string,
  ): Promise<{
    statusCode: number;
    body: PairViewDto;
  }> {
    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.PAIR_GAME_QUIZ}/${gameId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    return {
      statusCode: response.status,
      body: response.body,
    };
  }

  async getMyCurrentPairGame(accessToken: string): Promise<{
    statusCode: number;
    body: PairViewDto;
  }> {
    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.PAIR_GAME_QUIZ}/my-current`)
      .set('Authorization', `Bearer ${accessToken}`);

    return {
      statusCode: response.status,
      body: response.body,
    };
  }

  async getMyPairGames(
    token: string,
    query: {
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      pageNumber?: number;
      pageSize?: number;
    } = {},
  ) {
    const queryString = new URLSearchParams();
    if (query.sortBy) queryString.append('sortBy', query.sortBy);
    if (query.sortDirection) queryString.append('sortDirection', query.sortDirection);
    if (query.pageNumber) queryString.append('pageNumber', query.pageNumber.toString());
    if (query.pageSize) queryString.append('pageSize', query.pageSize.toString());

    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.PAIR_GAME_QUIZ}/my${queryString.toString() ? '?' + queryString.toString() : ''}`)
      .set('Authorization', `Bearer ${token}`);

    return {
      statusCode: response.status,
      body: response.body,
    };
  }
}
