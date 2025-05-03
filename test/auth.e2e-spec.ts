import { HttpStatus } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestSettingsInitializer } from './helpers/init-settings';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { deleteAllData } from './helpers/delete-all-data';
import { CreateUserInputDto } from '../src/modules/user-accounts/users/api/input-dto/users.input-dto';
import { EmailService } from '../src/modules/notifications/email.service';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let usersTestManager: UsersTestManager;
  let jwtService: JwtService;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    authTestManager = result.authTestManager;
    usersTestManager = result.usersTestManager;
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // Common test data
  const validUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.com',
  };

  describe('POST /auth/registration', () => {
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
    const unconfirmedUser = {
      login: 'user2',
      password: 'password123',
      email: 'unconfirmed@example.com',
    };

    beforeEach(async () => {
      // Register and confirm first user
      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (!user?.emailConfirmation?.confirmationCode) {
        throw new Error('User or confirmation code not found');
      }
      await authTestManager.confirmRegistration(
        { code: user.emailConfirmation.confirmationCode },
        HttpStatus.NO_CONTENT,
      );

      // Create unconfirmed user
      await authTestManager.registration(
        unconfirmedUser,
        HttpStatus.NO_CONTENT,
      );
    });

    it('should login with valid credentials and return access token', async () => {
      const response = await authTestManager.login(
        {
          loginOrEmail: validUser.login,
          password: validUser.password,
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
      await authTestManager.login(
        { loginOrEmail: validUser.login, password: 'wrongpassword' },
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
      await authTestManager.login(
        {
          loginOrEmail: unconfirmedUser.login,
          password: unconfirmedUser.password,
        },
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should not login with empty string login', async () => {
      await authTestManager.login(
        { loginOrEmail: '', password: 'password123' },
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('POST /auth/refresh-token', () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Register and confirm user
      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (!user?.emailConfirmation?.confirmationCode) {
        throw new Error('User or confirmation code not found');
      }
      await authTestManager.confirmRegistration(
        { code: user.emailConfirmation.confirmationCode },
        HttpStatus.NO_CONTENT,
      );
      const loginResponse = await authTestManager.login(
        {
          loginOrEmail: validUser.login,
          password: validUser.password,
        },
        HttpStatus.OK,
      );

      // Extract refresh token
      refreshTokenCookie = loginResponse.headers['set-cookie'][0];
      expect(refreshTokenCookie).toBeDefined();
    });

    it('should return 401 when trying to refresh token after logout', async () => {
      // First, logout the user
      await authTestManager.logout(refreshTokenCookie);

      // Try to refresh token with the same refresh token
      await authTestManager
        .refreshToken(refreshTokenCookie)
        .expect(HttpStatus.UNAUTHORIZED);
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
    let userId: string;

    beforeEach(async () => {
      // Register and confirm user
      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (!user?.emailConfirmation?.confirmationCode) {
        throw new Error('User or confirmation code not found');
      }
      await authTestManager.confirmRegistration(
        { code: user.emailConfirmation.confirmationCode },
        HttpStatus.NO_CONTENT,
      );
      userId = user.id;
    });

    it('should return user information with valid token', async () => {
      // Get fresh access token
      const loginResponse = await authTestManager.login(
        { loginOrEmail: validUser.login, password: validUser.password },
        HttpStatus.OK,
      );
      const freshAccessToken = loginResponse.body.accessToken;

      const response = await authTestManager.me(
        freshAccessToken,
        HttpStatus.OK,
      );

      const expectedResponse = {
        email: validUser.email,
        login: validUser.login,
        userId: userId.toString(), // userId is returned as a string
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

  describe('Password Recovery Flow', () => {
    let recoveryCode: string;

    beforeEach(async () => {
      // Register and confirm user
      await authTestManager.registration(validUser, HttpStatus.NO_CONTENT);
      const user = await usersTestManager.getUserByEmail(validUser.email);
      if (!user?.emailConfirmation?.confirmationCode) {
        throw new Error('User or confirmation code not found');
      }
      await authTestManager.confirmRegistration(
        { code: user.emailConfirmation.confirmationCode },
        HttpStatus.NO_CONTENT,
      );
    });

    describe('POST /auth/password-recovery', () => {
      it('should initiate password recovery for existing email', async () => {
        await authTestManager.passwordRecovery(
          { email: validUser.email },
          HttpStatus.NO_CONTENT,
        );

        // Get recovery code for next tests
        const user = await usersTestManager.getUserByEmail(validUser.email);
        if (!user?.passwordRecovery?.recoveryCode) {
          throw new Error('Recovery code not found');
        }
        recoveryCode = user.passwordRecovery.recoveryCode;
      });

      it('should return success even for non-existent email (security)', async () => {
        await authTestManager.passwordRecovery(
          { email: 'nonexistent@example.com' },
          HttpStatus.NO_CONTENT,
        );
      });
    });

    describe('POST /auth/new-password', () => {
      beforeEach(async () => {
        // Initiate password recovery to get the code
        await authTestManager.passwordRecovery(
          { email: validUser.email },
          HttpStatus.NO_CONTENT,
        );

        // Get recovery code
        const user = await usersTestManager.getUserByEmail(validUser.email);
        if (!user?.passwordRecovery?.recoveryCode) {
          throw new Error('Recovery code not found');
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
});
