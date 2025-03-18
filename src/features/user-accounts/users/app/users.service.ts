import { Injectable } from '@nestjs/common';
import { BcryptService } from '../../utils/bcrypt.service';
import {
  CreateUserDomainDto,
  EmailConfirmationStatus,
  PgUsersRepository,
} from '../infrastructure/pg.users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUserCredentials(login: string, email: string) {
    const userByLogin =
      await this.pgUsersRepository.findUserByLoginOrEmail(login);

    if (userByLogin) {
      return {
        field: 'login',
        message: 'user with this login is already registered',
      };
    }

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

    return await this.pgUsersRepository.createUser(createUserDto);
  }
}
