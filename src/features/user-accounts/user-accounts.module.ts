import { Module } from '@nestjs/common';
import { UserController } from './api/users.controller';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './app/facades/bcrypt.service';
import { AuthController } from './api/auth.controller';
import { EmailService } from './app/facades/email.service';
import { CustomJwtService } from './app/facades/custom-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/jwt/jwt-auth.strategy';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { JwtRefreshStrategy } from './guards/jwt/jwt-refresh.strategy';
import { CreateUserUseCase } from './app/users.use-cases/create-user.use-case';
import { DeleteUserUseCase } from './app/users.use-cases/delete-user.use-case';
import { LoginUseCases } from './app/auth.use-cases/login.use-cases';
import { ConfirmEmailRegistrationUseCase } from './app/auth.use-cases/confirm-email-registration.use-case';
import { ResendRegistrationEmailUseCase } from './app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailUseCase } from './app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordUseCase } from './app/auth.use-cases/set-new-password.use-case';
import { CheckIfUserIsAbleToLoginUseCase } from './app/users.use-cases/check-user-able-login.use-case';
import { UserAccountsConfig } from './user-account.config';
import { RefreshTokenUseCases } from './app/auth.use-cases/refresh-token.use-cases';
import { CreateSessionUseCase } from './app/sessions.use-cases/create-session.use-case';
import { Session, SessionSchema } from './domain/session.entity';
import { SessionsRepository } from './infrastructure/sessions.repository';

const adapters = [BcryptService, EmailService, CustomJwtService];
const strategies = [
  JwtStrategy,
  LocalStrategy,
  BasicStrategy,
  JwtRefreshStrategy,
];
const usersUseCases = [
  CreateUserUseCase,
  DeleteUserUseCase,
  CheckIfUserIsAbleToLoginUseCase,
];
const authUseCases = [
  LoginUseCases,
  ConfirmEmailRegistrationUseCase,
  ResendRegistrationEmailUseCase,
  SendRecoverPasswordEmailUseCase,
  SetNewPasswordUseCase,
  RefreshTokenUseCases,
  CreateSessionUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule,
  ],
  controllers: [UserController, AuthController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    SessionsRepository,
    UserAccountsConfig,
    ...adapters,
    ...strategies,
    ...usersUseCases,
    ...authUseCases,
  ],
  exports: [BasicStrategy, UsersRepository],
})
export class UserAccountsModule {}
