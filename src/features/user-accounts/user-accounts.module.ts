import { Module } from '@nestjs/common';
import { UserController } from './users/api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/domain/user.entity';
import { AuthController } from './auth/api/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/jwt/jwt-auth.strategy';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { JwtRefreshStrategy } from './guards/jwt/jwt-refresh.strategy';
import { UserAccountsConfig } from './user-account.config';
import { CreateSessionUseCase } from './sessions/app/sessions.use-cases/create-session.use-case';
import { Session, SessionSchema } from './sessions/domain/session.entity';
import { SessionsRepository } from './sessions/infrastructure/sessions.repository';
import { UpdateSessionTimeUseCase } from './sessions/app/sessions.use-cases/update-session-time.use-case';
import { DeleteSessionUseCase } from './sessions/app/sessions.use-cases/delete-session.use-case';
import { ConfirmEmailRegistrationUseCase } from './auth/app/auth.use-cases/confirm-email-registration.use-case';
import { LoginUseCases } from './auth/app/auth.use-cases/login.use-cases';
import { RefreshTokenUseCases } from './auth/app/auth.use-cases/refresh-token.use-cases';
import { ResendRegistrationEmailUseCase } from './auth/app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailUseCase } from './auth/app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordUseCase } from './auth/app/auth.use-cases/set-new-password.use-case';
import { BcryptService } from './facades/bcrypt.service';
import { CustomJwtService } from './facades/custom-jwt.service';
import { EmailService } from './facades/email.service';
import { CheckIfUserIsAbleToLoginUseCase } from './users/app/users.use-cases/check-user-able-login.use-case';
import { CreateUserUseCase } from './users/app/users.use-cases/create-user.use-case';
import { DeleteUserUseCase } from './users/app/users.use-cases/delete-user.use-case';
import { UsersQueryRepository } from './users/infrastructure/query/users.query-repository';
import { UsersRepository } from './users/infrastructure/users.repository';
import { SecurityController } from './sessions/api/security.controller';
import { SessionsQueryRepository } from './sessions/infrastructure/query/sessions.query-repository';
import { DeleteAllSessionsUseCase } from './sessions/app/sessions.use-cases/delete-all-sessions.use-case';
import { DeleteSessionByIdUseCase } from './sessions/app/sessions.use-cases/delete-session-by-id.use-case';
import { ValidateRefreshTokenUseCase } from './sessions/app/sessions.use-cases/validate-refresh-token.use-case';
import { CoreModule } from '../../core/core-module';

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
];

const sessionsUseCases = [
  CreateSessionUseCase,
  UpdateSessionTimeUseCase,
  DeleteSessionUseCase,
  DeleteAllSessionsUseCase,
  DeleteSessionByIdUseCase,
  ValidateRefreshTokenUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.register({}),
    CoreModule,
  ],
  controllers: [UserController, AuthController, SecurityController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    SessionsRepository,
    SessionsQueryRepository,
    UserAccountsConfig,
    ...adapters,
    ...strategies,
    ...usersUseCases,
    ...authUseCases,
    ...sessionsUseCases,
  ],
  exports: [BasicStrategy, UsersRepository],
})
export class UserAccountsModule {}
