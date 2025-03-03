import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from '../../facades/bcrypt.service';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { EmailConfirmationStatus } from '../domain/email-confirmation.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUserCredentials(login: string, email: string) {
    const userByLogin =
      await this.usersRepository.findUserByLoginOrEmail(login);
    if (userByLogin) {
      return {
        field: 'login',
        message: 'user with this login is already registered',
      };
    }

    const userByEmail =
      await this.usersRepository.findUserByLoginOrEmail(email);
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

    const newUser = this.UserModel.createInstance(createUserDto);
    await this.usersRepository.save(newUser);

    return {
      userId: newUser._id.toString(),
    };
  }
}
