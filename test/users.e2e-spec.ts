import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInputDto } from '../src/features/user-accounts/users/api/input-dto/users.input-dto';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { UserViewDto } from '../src/features/user-accounts/users/api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import { App } from 'supertest/types';
import { PATHS } from 'src/constants';

describe('Users Controller (e2e)', () => {
  let app: INestApplication;
  let userTestManager: UsersTestManager;
  let httpServer: App;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    userTestManager = result.usersTestManager;
    httpServer = result.httpServer;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /users', () => {
    const validUser: CreateUserInputDto = {
      login: 'pepa123',
      email: 'pepa@mail.com',
      password: 'password123',
    };

    it('should create user with valid data', async () => {
      const response = await userTestManager.createUser(validUser);

      expect(response).toEqual({
        id: expect.any(String),
        login: validUser.login,
        email: validUser.email,
        createdAt: expect.any(String),
      });
    });

    it('should not create user without auth credentials', async () => {
      await request(httpServer)
        .post(`/${PATHS.USERS}`)
        .send(validUser)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    describe('login validation', () => {
      it('should not create user with too short login', async () => {
        const invalidUser = { ...validUser, login: 'ab' }; // min length is 3

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with too long login', async () => {
        const invalidUser = { ...validUser, login: 'verylonglogin' }; // max length is 10

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with invalid login characters', async () => {
        const invalidUser = { ...validUser, login: 'user@123' }; // only a-z, A-Z, 0-9, _, - allowed

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with empty login', async () => {
        const invalidUser = { ...validUser, login: '' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with whitespace login', async () => {
        const invalidUser = { ...validUser, login: '   ' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });

    describe('password validation', () => {
      it('should not create user with too short password', async () => {
        const invalidUser = { ...validUser, password: '12345' }; // min length is 6

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with too long password', async () => {
        const invalidUser = {
          ...validUser,
          password: 'verylongpasswordthatisover20chars',
        }; // max length is 20

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with empty password', async () => {
        const invalidUser = { ...validUser, password: '' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with whitespace password', async () => {
        const invalidUser = { ...validUser, password: '   ' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });

    describe('email validation', () => {
      it('should not create user with invalid email format', async () => {
        const invalidUser = { ...validUser, email: 'invalid-email' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with empty email', async () => {
        const invalidUser = { ...validUser, email: '' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not create user with whitespace email', async () => {
        const invalidUser = { ...validUser, email: '   ' };

        await userTestManager.createUser(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /users', () => {
    it('should return empty list when no users exist', async () => {
      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should return paginated list of users', async () => {
      // Create 5 users
      await userTestManager.createSeveralUsers(5);

      const response = await request(httpServer)
        .get(`/${PATHS.USERS}?pageSize=3&pageNumber=2`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(body.items).toHaveLength(2); // Second page should have 2 items
      expect(body.totalCount).toBe(5);
      expect(body.pagesCount).toBe(2);
      expect(body.page).toBe(2);
      expect(body.pageSize).toBe(3);
    });

    it('should search users by login term', async () => {
      // Create users with different logins
      await userTestManager.createUser({
        login: 'john123',
        email: 'john@mail.com',
        password: 'password123',
      });
      await userTestManager.createUser({
        login: 'jane123',
        email: 'jane@mail.com',
        password: 'password123',
      });

      const response = await request(httpServer)
        .get(`/${PATHS.USERS}?searchLoginTerm=john`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].login).toBe('john123');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete existing user', async () => {
      // Create a user first
      const user = await userTestManager.createUser({
        login: 'testuser',
        email: 'delete@mail.com',
        password: 'password123',
      });

      // Delete the user
      await request(httpServer)
        .delete(`/${PATHS.USERS}/${user.id}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      // Verify user is deleted by trying to get all users
      const response = await request(httpServer)
        .get(`/${PATHS.USERS}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<UserViewDto[]>;
      expect(body.items).toHaveLength(0);
    });

    it('should return 404 when deleting non-existing user', async () => {
      await request(httpServer)
        .delete(`/${PATHS.USERS}/nonexistentid`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not delete user without auth credentials', async () => {
      const user = await userTestManager.createUser({
        login: 'testuser',
        email: 'delete@mail.com',
        password: 'password123',
      });

      await request(httpServer)
        .delete(`/${PATHS.USERS}/${user.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
