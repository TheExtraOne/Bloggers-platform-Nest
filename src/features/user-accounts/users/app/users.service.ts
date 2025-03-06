import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { MgUsersRepository } from '../infrastructure/mg.users.repository';
import { BcryptService } from '../../utils/bcrypt.service';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { EmailConfirmationStatus } from '../domain/email-confirmation.schema';
import { PgUsersRepository } from '../infrastructure/pg.users.repository';

// TODO: turn to base class
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUserCredentials(login: string, email: string) {
    // For MongoDB
    // const userByLogin =
    //   await this.mgUsersRepository.findUserByLoginOrEmail(login);
    // For Postgres
    const userByLogin =
      await this.pgUsersRepository.findUserByLoginOrEmail(login);

    if (userByLogin) {
      return {
        field: 'login',
        message: 'user with this login is already registered',
      };
    }

    // For MongoDB
    // const userByEmail =
    //   await this.mgUsersRepository.findUserByLoginOrEmail(email);
    // For Postgres
    const userByEmail =
      await this.pgUsersRepository.findUserByLoginOrEmail(email);

    if (userByEmail) {
      return {
        field: 'email',
        message: 'user with this email is already registered',
      };
    }

    return null;
  }

  async createUser(dto: {
    login: string;
    email: string;
    password: string;
    confirmationCode: string | null;
    expirationDate: Date | null;
    confirmationStatus: EmailConfirmationStatus;
  }) {
    const passwordHash = await this.bcryptService.hashPassword(dto.password);

    const createUserDto: CreateUserDomainDto = {
      email: dto.email,
      login: dto.login,
      passwordHash,
      confirmationCode: dto.confirmationCode,
      expirationDate: dto.expirationDate,
      confirmationStatus: dto.confirmationStatus,
    };

    // For MongoDB
    //   const newUser = this.UserModel.createInstance(createUserDto);
    //   await this.mgUsersRepository.save(newUser);
    //   return {
    //     userId: newUser._id.toString(),
    //   };

    // For PostgreSQL
    return await this.pgUsersRepository.createUser(createUserDto);
  }
}
