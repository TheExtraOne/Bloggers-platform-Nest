import { Module } from '@nestjs/common';
import { UserController } from './api/users.controller';
import { UserService } from './app/users.service';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './app/bcrypt.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UsersQueryRepository,
    UsersRepository,
    BcryptService,
  ],
  //   exports: [UsersRepository],
})
export class UserAccountsModule {}
