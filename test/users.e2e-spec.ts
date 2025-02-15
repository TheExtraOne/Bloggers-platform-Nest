import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { UserViewDto } from '../src/features/user-accounts/api/view-dto/users.view-dto';
import { EmailService } from '../src/features/user-accounts/app/email.service';
import { PATHS } from '../src/constants';
import { CreateUserInputDto } from '../src/features/user-accounts/api/input-dto/users.input-dto';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './helpers/mongodb-memory-server';
import { EmailServiceMock } from './mock/email-service.mock';
import { appSetup } from '../src/setup/app.setup';
// import { initSettings } from './helpers/init-settings';
// import { deleteAllData } from './helpers/delete-all-data';

describe('users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useClass(EmailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
    await startMongoMemoryServer();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(`${PATHS.TESTING}/all-data`);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it('should create user', async () => {
    const body: CreateUserInputDto = {
      login: 'pepa123',
      email: 'pepa@mail.com',
      password: 'se1cure2pass',
    };

    const response = await request(app.getHttpServer())
      .post(`/${PATHS.USERS}`)
      .auth('admin', 'qwerty')
      .send(body)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        login: body.login,
        email: body.email,
      }),
    );
  });

  it('should not create user without auth', async () => {
    const body: CreateUserInputDto = {
      login: 'name1',
      email: 'email@email.com',
      password: '123123123',
    };

    await request(app.getHttpServer())
      .post(`/${PATHS.USERS}`)
      .send(body)
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
