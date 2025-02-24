import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { CreateUserInputDto } from '../../../src/features/user-accounts/users/api/input-dto/users.input-dto';
import { UserViewDto } from '../../../src/features/user-accounts/users/api/view-dto/users.view-dto';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: HttpStatus = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.USERS}`)
      .send(createModel)
      .auth(username, password)
      .expect(statusCode);

    return response.body;
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

  async getUserByEmail(email: string) {
    const dbConnection = this.app.get('DatabaseConnection');
    const usersCollection = dbConnection.collection('users');
    const user = await usersCollection.findOne({ email });
    return user;
  }
}
