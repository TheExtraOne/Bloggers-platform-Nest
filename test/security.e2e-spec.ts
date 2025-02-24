import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { SessionsTestManager } from './helpers/managers/sessions-test-manager';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';

describe('SecurityController (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let usersTestManager: UsersTestManager;
  let sessionsTestManager: SessionsTestManager;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    authTestManager = result.authTestManager;
    usersTestManager = result.usersTestManager;
    sessionsTestManager = result.sessionsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('GET /security/devices', () => {
    it('should return 401 if no refresh token provided', async () => {
      await sessionsTestManager.getAllSessions('', HttpStatus.UNAUTHORIZED);
    });

    it('should return active sessions for authenticated user', async () => {
      // Create user
      const user = {
        login: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user);

      // Login to create a session
      const loginResponse = await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });
      const refreshToken = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='))
        .split(';')[0]
        .split('=')[1];

      // Get sessions
      const sessions = await sessionsTestManager.getAllSessions(refreshToken);
      expect(sessions).toEqual([
        expect.objectContaining({
          ip: expect.any(String),
          title: expect.any(String),
          lastActiveDate: expect.any(String),
          deviceId: expect.any(String),
        }),
      ]);
    });
  });

  describe('DELETE /security/devices', () => {
    it('should return 401 if no refresh token provided', async () => {
      await sessionsTestManager.terminateAllSessions(
        '',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should terminate all sessions except current', async () => {
      // Create user
      const user = {
        login: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user);

      // Login multiple times to create sessions
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });
      const refreshToken1 = loginResponse1.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='))
        .split(';')[0]
        .split('=')[1];

      await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });

      // Verify multiple sessions exist
      const sessionsBefore =
        await sessionsTestManager.getAllSessions(refreshToken1);
      expect(sessionsBefore.length).toBe(2);

      // Terminate all other sessions
      await sessionsTestManager.terminateAllSessions(refreshToken1);

      // Verify only current session remains
      const sessionsAfter =
        await sessionsTestManager.getAllSessions(refreshToken1);
      expect(sessionsAfter).toHaveLength(1);
    });
  });

  describe('DELETE /security/devices/:id', () => {
    it('should return 401 if no refresh token provided', async () => {
      await sessionsTestManager.terminateSessionById(
        'any-device-id',
        '',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should return 403 when trying to delete another user session', async () => {
      // Create first user and get their session
      const user1 = {
        login: 'testuser5',
        email: 'test5@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user1);

      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      });
      const refreshToken1 = loginResponse1.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='))
        .split(';')[0]
        .split('=')[1];

      // Create second user and get their session
      const user2 = {
        login: 'testuser6',
        email: 'test6@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user2);

      const loginResponse2 = await authTestManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      });

      // Get second user's sessions
      const user2Sessions = await sessionsTestManager.getAllSessions(
        loginResponse2.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('refreshToken='))
          .split(';')[0]
          .split('=')[1],
      );

      // Try to delete second user's session using first user's token
      await sessionsTestManager.terminateSessionById(
        user2Sessions[0].deviceId,
        refreshToken1,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 404 if session not found', async () => {
      // Create user and login
      const user = {
        login: 'testuser3',
        email: 'test3@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user);

      const loginResponse = await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });
      const refreshToken = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='))
        .split(';')[0]
        .split('=')[1];

      await sessionsTestManager.terminateSessionById(
        'non-existent-device-id',
        refreshToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should successfully terminate specific session', async () => {
      // Create user
      const user = {
        login: 'testuser4',
        email: 'test4@example.com',
        password: 'password123',
      };
      await usersTestManager.createUser(user);

      // Login to create sessions
      const loginResponse1 = await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });
      const refreshToken1 = loginResponse1.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='))
        .split(';')[0]
        .split('=')[1];

      await authTestManager.login({
        loginOrEmail: user.login,
        password: user.password,
      });

      // Get all sessions and find one to terminate
      const sessions = await sessionsTestManager.getAllSessions(refreshToken1);
      expect(sessions.length).toBe(2);

      const sessionToTerminate = sessions.find(
        (s) => s.deviceId !== sessions[0].deviceId,
      );
      expect(sessionToTerminate).toBeDefined();

      if (!sessionToTerminate) {
        throw new Error('Failed to find session to terminate');
      }

      // Terminate specific session
      await sessionsTestManager.terminateSessionById(
        sessionToTerminate.deviceId,
        refreshToken1,
      );

      // Verify session was terminated
      const sessionsAfter =
        await sessionsTestManager.getAllSessions(refreshToken1);
      expect(sessionsAfter.length).toBe(sessions.length - 1);
      expect(
        sessionsAfter.find((s) => s.deviceId === sessionToTerminate.deviceId),
      ).toBeUndefined();
    });
  });
});
