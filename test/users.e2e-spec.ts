import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateUserInputDto } from '../src/features/user-accounts/api/input-dto/users.input-dto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { PATHS } from '../src/settings';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    await app.init();

    httpServer = app.getHttpServer();
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await request(httpServer).delete(`/${PATHS.TESTING}/all-data`).expect(204);
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserInputDto = {
        email: 'test@example.com',
        login: 'testuser',
        password: 'password123',
      };

      const { body } = await request(httpServer)
        .post(`/${PATHS.USERS}`)
        .send(createUserDto)
        .expect(201);

      expect(body.login).toBe(createUserDto.login);
      expect(body.email).toBe(createUserDto.email);
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();

      expect(body.password).toBeUndefined();
      expect(body.passwordHash).toBeUndefined();
    });

    // it('should not create user with invalid data', async () => {
    //   const invalidUserDto = {
    //     email: 'invalid-email',
    //     password: '123',
    //   };

    //   const response = await request(app.getHttpServer())
    //     .post(`/api/${PATHS.USERS}`)
    //     .send(invalidUserDto)
    //     .expect(400);

    //   expect(response.body).toBeDefined();
    //   expect(response.body.errorsMessages).toBeDefined();
    //   expect(response.body.errorsMessages.length).toBeGreaterThan(0);
    // });
  });

  describe('GET /users', () => {
    it('should return empty paginated list when no users exist', async () => {
      const { body } = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      expect(body).toEqual({
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should return paginated list of users', async () => {
      // Create test user first
      const createUserDto: CreateUserInputDto = {
        email: 'test@example.com',
        login: 'testuser',
        password: 'password123',
      };

      await request(httpServer)
        .post(`/${PATHS.USERS}`)
        .send(createUserDto)
        .expect(201);

      const { body } = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      expect(body).toMatchObject({
        items: [
          {
            email: createUserDto.email,
            login: createUserDto.login,
          },
        ],
        totalCount: 1,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete existing user', async () => {
      // Create user first
      const createUserDto: CreateUserInputDto = {
        email: 'test@example.com',
        login: 'testuser',
        password: 'password123',
      };

      const createResponse = await request(httpServer)
        .post(`/${PATHS.USERS}`)
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body.id;
      expect(userId).toBeDefined();

      // Delete the user
      await request(httpServer).delete(`/${PATHS.USERS}/${userId}`).expect(204);

      // Verify user is not returned in GET request
      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      expect(response.body.items).toHaveLength(0);
    });

    it('should return 404 when deleting non-existing user', async () => {
      const nonExistingId = new mongoose.Types.ObjectId().toString();

      await request(httpServer)
        .delete(`/${PATHS.USERS}/${nonExistingId}`)
        .expect(404);
    });
  });
});
