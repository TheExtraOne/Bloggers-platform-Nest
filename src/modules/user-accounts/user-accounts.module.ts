import { Module } from '@nestjs/common';
import { UserController } from './users/api/users.controller';
import { AuthController } from './auth/api/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/jwt/jwt-auth.strategy';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { JwtRefreshStrategy } from './guards/jwt/jwt-refresh.strategy';
import { UserAccountsConfig } from './user-account.config';
import { ConfirmEmailRegistrationUseCase } from './auth/app/use-cases/confirm-email-registration.use-case';
import { LoginUseCases } from './auth/app/use-cases/login.use-cases';
import { RefreshTokenUseCases } from './auth/app/use-cases/refresh-token.use-cases';
import { ResendRegistrationEmailUseCase } from './auth/app/use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailUseCase } from './auth/app/use-cases/send-recover-password-email.use-case';
import { SetNewPasswordUseCase } from './auth/app/use-cases/set-new-password.use-case';
import { BcryptService } from './utils/bcrypt.service';
import { CustomJwtService } from './utils/custom-jwt.service';
import { CheckIfUserIsAbleToLoginUseCase } from './users/app/use-cases/check-user-able-login.use-case';
import { CreateUserUseCase } from './users/app/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './users/app/use-cases/delete-user.use-case';
import { SecurityController } from './sessions/api/security.controller';
import { DeleteAllSessionsUseCase } from './sessions/app/sessions.use-cases/delete-all-sessions.use-case';
import { DeleteSessionByIdUseCase } from './sessions/app/sessions.use-cases/delete-session-by-id.use-case';
import { ValidateRefreshTokenUseCase } from './sessions/app/sessions.use-cases/validate-refresh-token.use-case';
import { AdminCreateUserUseCase } from './users/app/use-cases/admin-create-user.use-case';
import { UsersService } from './users/app/users.service';
import { PgUsersQueryRepository } from './users/infrastructure/query/pg.users.query-repository';
import { PgUsersRepository } from './users/infrastructure/pg.users.repository';
import { PgSessionsRepository } from './sessions/infrastructure/pg.sessions.repository';
import { PgSessionsQueryRepository } from './sessions/infrastructure/query/pg.sessions.query-repository';
import { PgExternalUsersRepository } from './users/infrastructure/pg.external.users.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/domain/entities/user.entity';
import { UsersEmailConfirmation } from './users/domain/entities/email.confirmation.entity';
import { UsersPasswordRecovery } from './users/domain/entities/password.recovery.entity';
import { Sessions } from './sessions/domain/entities/session.entity';
import { GetMeQueryHandler } from './users/app/queries/get-me.query';
import { GetAllUsersQueryHandler } from './users/app/queries/get-all-users.query';
import { GetUserByIdQueryHandler } from './users/app/queries/get-user-by-id.query';
import { GetAllSessionsQueryHandler } from './sessions/app/queries/get-all-sessions.query';

const adapters = [BcryptService, CustomJwtService];
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
const usersQueries = [
  GetMeQueryHandler,
  GetAllUsersQueryHandler,
  GetUserByIdQueryHandler,
];
const authUseCases = [
  LoginUseCases,
  ConfirmEmailRegistrationUseCase,
  ResendRegistrationEmailUseCase,
  SendRecoverPasswordEmailUseCase,
  SetNewPasswordUseCase,
  RefreshTokenUseCases,
];

const sessionsQueries = [GetAllSessionsQueryHandler];

const sessionsUseCases = [
  DeleteAllSessionsUseCase,
  DeleteSessionByIdUseCase,
  ValidateRefreshTokenUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UsersEmailConfirmation,
      UsersPasswordRecovery,
      Sessions,
    ]),
    JwtModule.register({}),
  ],
  controllers: [UserController, AuthController, SecurityController],
  providers: [
    PgUsersQueryRepository,
    PgUsersRepository,
    PgExternalUsersRepository,
    PgSessionsRepository,
    PgSessionsQueryRepository,
    UserAccountsConfig,
    UsersService,
    ...adapters,
    ...strategies,
    ...usersUseCases,
    ...usersQueries,
    ...authUseCases,
    ...sessionsQueries,
    ...sessionsUseCases,
  ],
  exports: [PgExternalUsersRepository],
})
export class UserAccountsModule {}
