import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInputDto } from '../../src/features/user-accounts/api/input-dto/users.input-dto';
import { UserViewDto } from '../../src/features/user-accounts/api/view-dto/users.view-dto';
import { PATHS } from '../../src/constants';
import { MeViewDto } from 'src/features/user-accounts/api/view-dto/me.view-dto';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<UserViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.USERS}`)
      .send(createModel)
      .auth('admin', 'qwerty')
      .expect(statusCode);

    return response.body;
  }

  async login(
    login: string,
    password: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<{ accessToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.AUTH}/login`)
      .send({ login, password })
      .expect(statusCode);

    return response.body;
  }

  async me(
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<MeViewDto> {
    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.AUTH}/me`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode);

    return response.body;
  }

  async createAndLoginSeveralUsers(count: number) {
    const tokens = [] as { accessToken: string }[];

    for (let i = 0; i < count; ++i) {
      await this.createUser({
        login: `test${i}`,
        email: `test${i}@gmail.com`,
        password: 'qwerty',
      });

      const token = await this.login(`test${i}`, 'qwerty');
      tokens.push(token);
    }

    return tokens;
  }

  async createSeveralUsers(count: number) {
    const users = [] as UserViewDto[];

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
}
