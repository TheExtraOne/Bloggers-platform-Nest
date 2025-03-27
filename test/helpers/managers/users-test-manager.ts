import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { CreateUserInputDto } from '../../../src/modules/user-accounts/users/api/input-dto/users.input-dto';
import { PGUserViewDto } from '../../../src/modules/user-accounts/users/api/view-dto/users.view-dto';
import { DataSource } from 'typeorm';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: HttpStatus = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.SA_USERS}`)
      .send(createModel)
      .auth(username, password)
      .expect(statusCode);

    return response.body;
  }

  async createSeveralUsers(count: number) {
    const users = [] as PGUserViewDto[];

    for (let i = 0; i < count; ++i) {
      const response = await this.createUser({
        login: `test${i}`,
        email: `test${i}@gmail.com`,
        password: 'qwerty',
      });

      users.push(response);
    }

    return users;
  }

  async getUserByEmail(email: string) {
    const dataSource = this.app.get(DataSource);
    const result = await dataSource.query(
      `
      SELECT 
        u.*,
        uec.confirmation_code,
        uec.expiration_date,
        uec.status,
        upr.recovery_code,
        upr.expiration_date
      FROM public.users u
      LEFT JOIN public.users_email_confirmation uec ON u.id = uec.user_id
      LEFT JOIN public.users_password_recovery upr ON u.id = upr.user_id
      WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email],
    );

    if (!result[0]) return null;

    const {
      id,
      login,
      email: userEmail,
      created_at,
      confirmation_code,
      expiration_date,
      status,
      recovery_code,
      recovery_expiration_date,
    } = result[0];
    return {
      id,
      login,
      email: userEmail,
      createdAt: created_at,
      emailConfirmation: {
        confirmationCode: confirmation_code,
        expirationDate: expiration_date,
        status: status,
      },
      passwordRecovery: {
        recoveryCode: recovery_code,
        expirationDate: recovery_expiration_date,
      },
    };
  }
}
