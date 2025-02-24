import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { SessionsViewDto } from '../../../src/features/user-accounts/sessions/api/view-dto/sessions.view-dto';

export class SessionsTestManager {
  constructor(private readonly app: INestApplication) {}

  async getAllSessions(
    refreshToken: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): Promise<SessionsViewDto[]> {
    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.SECURITY}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(statusCode);

    return response.body;
  }

  async terminateAllSessions(
    refreshToken: string,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.SECURITY}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(statusCode);
  }

  async terminateSessionById(
    deviceId: string,
    refreshToken: string,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.SECURITY}/devices/${deviceId}`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(statusCode);
  }
}
