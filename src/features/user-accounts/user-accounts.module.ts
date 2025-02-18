import { Module } from '@nestjs/common';
import { UserController } from './api/users.controller';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './app/bcrypt.service';
import { AuthController } from './api/auth.controller';
import { AuthService } from './app/auth.service';
import { EmailService } from './app/email.service';
import { CustomJwtService } from './app/custom-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/jwt/jwt.strategy';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { CreateUserUseCase } from './app/users.use-cases/create-user.use-case';
import { DeleteUserUseCase } from './app/users.use-cases/delete-user.use-case';

const adapters = [BcryptService, EmailService, CustomJwtService];
const strategies = [JwtStrategy, LocalStrategy, BasicStrategy];
const usersUseCases = [CreateUserUseCase, DeleteUserUseCase];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    AuthService,
    ...adapters,
    ...strategies,
    ...usersUseCases,
  ],
  exports: [BasicStrategy],
})
export class UserAccountsModule {}
