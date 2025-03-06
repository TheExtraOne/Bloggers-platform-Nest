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
import { MgSessionsRepository } from './sessions/infrastructure/mg.sessions.repository';
import { UpdateSessionTimeUseCase } from './sessions/app/sessions.use-cases/update-session-time.use-case';
import { DeleteSessionUseCase } from './sessions/app/sessions.use-cases/delete-session.use-case';
import { ConfirmEmailRegistrationUseCase } from './auth/app/auth.use-cases/confirm-email-registration.use-case';
import { LoginUseCases } from './auth/app/auth.use-cases/login.use-cases';
import { RefreshTokenUseCases } from './auth/app/auth.use-cases/refresh-token.use-cases';
import { ResendRegistrationEmailUseCase } from './auth/app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailUseCase } from './auth/app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordUseCase } from './auth/app/auth.use-cases/set-new-password.use-case';
import { BcryptService } from './utils/bcrypt.service';
import { CustomJwtService } from './utils/custom-jwt.service';
import { EmailService } from './utils/email.service';
import { CheckIfUserIsAbleToLoginUseCase } from './users/app/users.use-cases/check-user-able-login.use-case';
import { CreateUserUseCase } from './users/app/users.use-cases/create-user.use-case';
import { DeleteUserUseCase } from './users/app/users.use-cases/delete-user.use-case';
import { MgUsersQueryRepository } from './users/infrastructure/query/mg.users.query-repository';
import { MgUsersRepository } from './users/infrastructure/mg.users.repository';
import { SecurityController } from './sessions/api/security.controller';
import { SessionsQueryRepository } from './sessions/infrastructure/query/sessions.query-repository';
import { DeleteAllSessionsUseCase } from './sessions/app/sessions.use-cases/delete-all-sessions.use-case';
import { DeleteSessionByIdUseCase } from './sessions/app/sessions.use-cases/delete-session-by-id.use-case';
import { ValidateRefreshTokenUseCase } from './sessions/app/sessions.use-cases/validate-refresh-token.use-case';
import { CoreModule } from '../../core/core-module';
import { AdminCreateUserUseCase } from './users/app/users.use-cases/admin-create-user.use-case';
import { UsersService } from './users/app/users.service';
import { PgUsersQueryRepository } from './users/infrastructure/query/pg.users.query-repository';
import { PgUsersRepository } from './users/infrastructure/pg.users.repository';
import { PgSessionsRepository } from './sessions/infrastructure/pg.sessions.repository';
// import { TypeOrmModule } from '@nestjs/typeorm';

const adapters = [BcryptService, EmailService, CustomJwtService];
const strategies = [
  JwtStrategy,
  LocalStrategy,
  BasicStrategy,
  JwtRefreshStrategy,
];
const usersUseCases = [
  CreateUserUseCase,
  AdminCreateUserUseCase,
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
    // TypeOrmModule.forFeature([User, Session]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.register({}),
    CoreModule,
  ],
  controllers: [UserController, AuthController, SecurityController],
  providers: [
    MgUsersQueryRepository,
    PgUsersQueryRepository,
    MgUsersRepository,
    PgUsersRepository,
    MgSessionsRepository,
    SessionsQueryRepository,
    PgSessionsRepository,
    UserAccountsConfig,
    UsersService,
    ...adapters,
    ...strategies,
    ...usersUseCases,
    ...authUseCases,
    ...sessionsUseCases,
  ],
  exports: [MgUsersRepository],
})
export class UserAccountsModule {}
