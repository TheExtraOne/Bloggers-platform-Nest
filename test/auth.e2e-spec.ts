import { HttpStatus } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestSettingsInitializer } from './helpers/init-settings';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { SessionsTestManager } from './helpers/managers/sessions-test-manager';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { deleteAllData } from './helpers/delete-all-data';
import { CreateUserInputDto } from '../src/features/user-accounts/users/api/input-dto/users.input-dto';
import { MeViewDto } from '../src/features/user-accounts/auth/api/view-dto/me.view-dto';
import { EmailService } from '../src/features/user-accounts/facades/email.service';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let usersTestManager: UsersTestManager;
  let sessionsTestManager: SessionsTestManager;
  let jwtService: JwtService;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    authTestManager = result.authTestManager;
    usersTestManager = result.usersTestManager;
    sessionsTestManager = result.sessionsTestManager;
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /auth/registration', () => {
    const validUser: CreateUserInputDto = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    it('should register user with valid data', async () => {
      const sendEmailMethod = (app.get(EmailService).sendRegistrationMail = jest
        .fn()
        .mockImplementation(() => Promise.resolve()));

      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);
      // Check that email was sent
      expect(sendEmailMethod).toHaveBeenCalled();
      // Check that user was created
      const user = await usersTestManager.getUserByEmail(validUser.email);
      expect(user).toBeDefined();
    });

    describe('login validation', () => {
      it('should not register user with empty login', async () => {
        const invalidUser = { ...validUser, login: '' };
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not register user with too short login', async () => {
        const invalidUser = { ...validUser, login: 'a' }; // min length is 3
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not register user with too long login', async () => {
        const invalidUser = { ...validUser, login: 'a'.repeat(11) }; // max length is 10
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });

    describe('password validation', () => {
      it('should not register user with empty password', async () => {
        const invalidUser = { ...validUser, password: '' };
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not register user with too short password', async () => {
        const invalidUser = { ...validUser, password: 'a'.repeat(5) }; // min length is 6
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not register user with too long password', async () => {
        const invalidUser = { ...validUser, password: 'a'.repeat(21) }; // max length is 20
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });

    describe('email validation', () => {
      it('should not register user with empty email', async () => {
        const invalidUser = { ...validUser, email: '' };
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });

      it('should not register user with invalid email format', async () => {
        const invalidUser = { ...validUser, email: 'invalid-email' };
        await authTestManager.registration(invalidUser, HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return access token', async () => {
      const user = {
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      };

      await usersTestManager.createUser(user);

      const response = await authTestManager.login(
        {
          loginOrEmail: user.login,
          password: user.password,
        },
        HttpStatus.OK,
      );

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(
        response.headers['set-cookie'].some((cookie: string) =>
          cookie.startsWith('refreshToken='),
        ),
      ).toBe(true);
    });

    it('should not login with incorrect password', async () => {
      const user = {
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      };

      await usersTestManager.createUser(user);

      await authTestManager.login(
        { loginOrEmail: user.login, password: 'wrongpassword' },
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should not login with non-existent user', async () => {
      await authTestManager.login(
        { loginOrEmail: 'nonexist', password: 'password123' },
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should not login with unconfirmed email', async () => {
      // Register new user but don't confirm email
      const unconfirmedUser = {
        login: 'user2',
        password: 'password123',
        email: 'unconfirmed@example.com',
      };
      await authTestManager.registration(
        unconfirmedUser,
        HttpStatus.NO_CONTENT,
      );

      await authTestManager.login(
        {
          loginOrEmail: unconfirmedUser.login,
          password: unconfirmedUser.password,
        },
        HttpStatus.UNAUTHORIZED,
      );
    });
  });

  describe('POST /auth/refresh-token', () => {
    const validUser = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    let accessToken: string;
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Create confirmed user
      await usersTestManager.createUser(validUser);

      // Login to get initial tokens
      const loginResponse = await authTestManager.login(
        {
          loginOrEmail: validUser.login,
          password: validUser.password,
        },
        HttpStatus.OK,
      );

      // Extract tokens
      accessToken = loginResponse.body.accessToken;
      const cookies = loginResponse.headers['set-cookie'];
      refreshTokenCookie = cookies[0]; // Take the first cookie which should be the refresh token

      expect(accessToken).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();

      // Add delay to ensure refresh token has different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should return 401 when trying to refresh token after logout', async () => {
      // First, logout the user
      await authTestManager.logout(refreshTokenCookie);

      // Try to refresh token with the same refresh token
      await authTestManager
        .refreshToken(refreshTokenCookie)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when trying to refresh token with old refresh token after successful refresh', async () => {
      // First refresh to get new tokens
      const refreshResponse = await authTestManager
        .refreshToken(refreshTokenCookie)
        .expect(HttpStatus.OK);

      const oldRefreshToken = refreshTokenCookie;
      const newRefreshToken = refreshResponse.headers['set-cookie']?.[0];
      expect(newRefreshToken).toBeDefined();

      // Try to refresh with old token
      await authTestManager
        .refreshToken(oldRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify new token still works
      await authTestManager.refreshToken(newRefreshToken).expect(HttpStatus.OK);
    });

    it('should return 401 when trying to refresh with expired token', async () => {
      // Create an expired refresh token
      const payload = {
        userId: 'testId',
        deviceId: 'testDevice',
        iat: Math.floor(Date.now() / 1000) - 3600,
      };
      const expiredToken = await jwtService.signAsync(payload, {
        secret: process.env.RT_SECRET,
        expiresIn: '-1h', // expired 1 hour ago
      });

      // Try to refresh with expired token
      await authTestManager
        .refreshToken(`refreshToken=${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /auth/me', () => {
    const validUser = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create confirmed user and get their ID
      const user = await usersTestManager.createUser(
        validUser,
        HttpStatus.CREATED,
      );
      userId = user.id;

      // Login to get access token
      const loginResponse = await authTestManager.login(
        { loginOrEmail: validUser.login, password: validUser.password },
        HttpStatus.OK,
      );
      accessToken = loginResponse.body.accessToken;
    });

    it('should return user information with valid token', async () => {
      const response = await authTestManager.me(accessToken, HttpStatus.OK);

      const expectedResponse: MeViewDto = {
        email: validUser.email,
        login: validUser.login,
        userId: userId,
      };

      expect(response).toEqual(expectedResponse);
    });

    it('should not return user information with invalid token', async () => {
      await authTestManager.me('invalid-token', HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /auth/registration-confirmation', () => {
    const validUser: CreateUserInputDto = {
      login: 'user3',
      password: 'password123',
      email: 'test1@example.com',
    };
    let confirmationCode: string;

    beforeEach(async () => {
      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);

      // Get user from database to get confirmation code
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (
        !user ||
        !user.emailConfirmation ||
        !user.emailConfirmation.confirmationCode
      ) {
        throw new Error('User or confirmation code not found');
      }
      confirmationCode = user.emailConfirmation.confirmationCode;
    });

    it('should confirm registration with valid code', async () => {
      await authTestManager.confirmRegistration(
        { code: confirmationCode },
        HttpStatus.NO_CONTENT,
      );

      // Try to login to verify the confirmation worked
      const loginResponse = await authTestManager.login(
        { loginOrEmail: validUser.login, password: validUser.password },
        HttpStatus.OK,
      );
      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should not confirm registration with invalid code', async () => {
      await authTestManager.confirmRegistration(
        { code: 'invalid-code' },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should not confirm registration with already used code', async () => {
      // Confirm first time
      await authTestManager.confirmRegistration(
        { code: confirmationCode },
        HttpStatus.NO_CONTENT,
      );

      // Try to confirm again with the same code
      await authTestManager.confirmRegistration(
        { code: confirmationCode },
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('POST /auth/registration-email-resending', () => {
    let validUser: CreateUserInputDto;
    let confirmationCode: string;

    beforeEach(async () => {
      validUser = {
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      };

      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);

      // Get user from database to get confirmation code
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (
        !user ||
        !user.emailConfirmation ||
        !user.emailConfirmation.confirmationCode
      ) {
        throw new Error('User or confirmation code not found');
      }
      confirmationCode = user.emailConfirmation.confirmationCode;
    });

    it('should resend registration email for unconfirmed user', async () => {
      await authTestManager.resendRegistrationEmail(
        { email: validUser.email },
        HttpStatus.NO_CONTENT,
      );
    });

    it('should not resend registration email for non-existent email', async () => {
      await authTestManager.resendRegistrationEmail(
        { email: 'nonexistent@example.com' },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should not resend registration email for already confirmed user', async () => {
      // First confirm the email
      await authTestManager.confirmRegistration(
        { code: confirmationCode },
        HttpStatus.NO_CONTENT,
      );

      // Then try to resend registration email for already confirmed user

      await authTestManager.resendRegistrationEmail(
        { email: validUser.email },
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('POST /auth/password-recovery', () => {
    const validUser = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    beforeEach(async () => {
      // Create confirmed user with admin credentials
      await usersTestManager.createUser(validUser, HttpStatus.CREATED);
    });

    it('should initiate password recovery for existing email', async () => {
      await authTestManager.passwordRecovery(
        { email: validUser.email },
        HttpStatus.NO_CONTENT,
      );
    });

    it('should return success even for non-existent email (security)', async () => {
      await authTestManager.passwordRecovery(
        { email: 'nonexistent@example.com' },
        HttpStatus.NO_CONTENT,
      );
    });
  });

  describe('POST /auth/new-password', () => {
    const validUser = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };
    let recoveryCode: string;

    beforeEach(async () => {
      // Create confirmed user with admin credentials
      await usersTestManager.createUser(validUser, HttpStatus.CREATED);

      // Initiate password recovery
      await authTestManager.passwordRecovery(
        { email: validUser.email },
        HttpStatus.NO_CONTENT,
      );

      // Get user from database to get recovery code
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (
        !user ||
        !user.passwordRecovery ||
        !user.passwordRecovery.recoveryCode
      ) {
        throw new Error('User or recovery code not found');
      }
      recoveryCode = user.passwordRecovery.recoveryCode;
    });

    it('should set new password with valid recovery code', async () => {
      const newPassword = 'newpassword123';
      await authTestManager.newPassword(
        {
          newPassword,
          recoveryCode,
        },
        HttpStatus.NO_CONTENT,
      );

      // Try to login with new password
      const loginResponse = await authTestManager.login(
        { loginOrEmail: validUser.login, password: newPassword },
        HttpStatus.OK,
      );
      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should not set new password with invalid recovery code', async () => {
      await authTestManager.newPassword(
        {
          newPassword: 'newpassword123',
          recoveryCode: 'invalid-code',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should not set new password if password is too short', async () => {
      await authTestManager.newPassword(
        {
          newPassword: 'short', // Password that's too short
          recoveryCode: recoveryCode,
        },
        HttpStatus.BAD_REQUEST,
      );
    });
  });
});

describe('Rate Limiting', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let usersTestManager: UsersTestManager;
  let sessionsTestManager: SessionsTestManager;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init(10000, 5);
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

  const validUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.com',
  };

  it('should handle rate limiting correctly for registration', async () => {
    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      const user = {
        ...validUser,
        email: `test${i}@example.com`,
        login: `testuser${i}`,
      };
      await authTestManager.registration(user, HttpStatus.NO_CONTENT);
    }

    // 6th request should be blocked
    const extraUser = {
      ...validUser,
      email: 'extra@example.com',
      login: 'extrauser',
    };
    await authTestManager.registration(extraUser, HttpStatus.TOO_MANY_REQUESTS);
  });

  it('should handle rate limiting correctly for password recovery', async () => {
    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      await authTestManager.passwordRecovery(
        { email: validUser.email },
        HttpStatus.NO_CONTENT,
      );
    }

    // 6th request should be blocked
    await authTestManager.passwordRecovery(
      { email: validUser.email },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });

  it('should not apply rate limit to /auth/me endpoint', async () => {
    // Register and login a user
    await usersTestManager.createUser(validUser, HttpStatus.CREATED);

    // Login to get access token
    const response = await authTestManager.login(
      { loginOrEmail: validUser.login, password: validUser.password },
      HttpStatus.OK,
    );

    // Make multiple requests to /auth/me
    for (let i = 0; i < 10; i++) {
      await authTestManager.me(response.body.accessToken, HttpStatus.OK);
    }
  });
});
