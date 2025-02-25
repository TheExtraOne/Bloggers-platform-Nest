import { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { ConfirmRegistrationInputDto } from '../../../src/features/user-accounts/auth/api/input-dto/confirm-registration.input-dto';
import { NewPasswordInputDto } from '../../../src/features/user-accounts/auth/api/input-dto/new-password.input-dto';
import { PasswordRecoveryInputDto } from '../../../src/features/user-accounts/auth/api/input-dto/password-recovery.input-dto';
import { ResendRegistrationInputDto } from '../../../src/features/user-accounts/auth/api/input-dto/resend-registration.input-dto';
import { CreateUserInputDto } from '../../../src/features/user-accounts/users/api/input-dto/users.input-dto';

export class AuthTestManager {
  constructor(private readonly app: INestApplication) {}

  async login(
    { loginOrEmail, password }: { loginOrEmail: string; password: string },
    statusCode: HttpStatus = HttpStatus.OK,
  ): Promise<any> {
    return await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/login`)
      .send({ loginOrEmail, password })
      .expect(statusCode);
  }

  async me(
    accessToken: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.AUTH}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(statusCode);

    return response.body;
  }

  async registration(
    dto: CreateUserInputDto,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/registration`)
      .send(dto)
      .expect(statusCode);
  }

  async confirmRegistration(
    dto: ConfirmRegistrationInputDto,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/registration-confirmation`)
      .send(dto)
      .expect(statusCode);
  }

  async resendRegistrationEmail(
    dto: ResendRegistrationInputDto,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/registration-email-resending`)
      .send(dto)
      .expect(statusCode);
  }

  async passwordRecovery(
    dto: PasswordRecoveryInputDto,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/password-recovery`)
      .send(dto)
      .expect(statusCode);
  }

  async newPassword(
    dto: NewPasswordInputDto,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/new-password`)
      .send(dto)
      .expect(statusCode);
  }

  refreshToken(cookie?: string) {
    const response = request(this.app.getHttpServer()).post(
      `/${PATHS.AUTH}/refresh-token`,
    );

    if (cookie) {
      response.set('Cookie', cookie);
    }

    return response;
  }

  async logout(refreshTokenCookie: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/logout`)
      .set('Cookie', refreshTokenCookie);
  }
}
