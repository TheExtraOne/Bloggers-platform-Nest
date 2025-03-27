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
      `SELECT * FROM public.users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result[0] || null;
  }
}
