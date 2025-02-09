import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateUserInputDto } from '../src/features/user-accounts/api/input-dto/users.input-dto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { PATHS } from '../src/settings';
import { UserViewDto } from '../src/features/user-accounts/api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import { App } from 'supertest/types';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryServer;
  let httpServer: App;

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

      const response = await request(httpServer)
        .post(`/${PATHS.USERS}`)
        .send(createUserDto)
        .expect(201);

      const userView = response.body as UserViewDto;
      expect(userView.login).toBe(createUserDto.login);
      expect(userView.email).toBe(createUserDto.email);
      expect(userView.id).toBeDefined();
      expect(userView.createdAt).toBeDefined();

      // Check that sensitive fields are not returned
      expect(userView).not.toHaveProperty('password');
      expect(userView).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /users', () => {
    it('should return empty paginated list when no users exist', async () => {
      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      const paginatedView = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(paginatedView).toEqual({
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

      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      const paginatedView = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(paginatedView).toMatchObject({
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

      const userId = (createResponse.body as UserViewDto).id;
      expect(userId).toBeDefined();

      // Delete the user
      await request(httpServer).delete(`/${PATHS.USERS}/${userId}`).expect(204);

      // Verify user is not returned in GET request
      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .query({ pageSize: 10, pageNumber: 1 })
        .expect(200);

      const paginatedView = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(paginatedView.items).toHaveLength(0);
    });

    it('should return 404 when deleting non-existing user', async () => {
      const nonExistingId = new mongoose.Types.ObjectId().toString();

      await request(httpServer)
        .delete(`/${PATHS.USERS}/${nonExistingId}`)
        .expect(404);
    });
  });
});
