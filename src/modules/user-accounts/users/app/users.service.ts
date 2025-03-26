import { Injectable } from '@nestjs/common';
import { PgUsersRepository } from '../infrastructure/pg.users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly pgUsersRepository: PgUsersRepository) {}

  async validateUserCredentials(login: string, email: string) {
    const userByLogin = await this.pgUsersRepository.isLoginOrEmailInUse(login);

    if (userByLogin) {
      return {
        field: 'login',
        message: 'user with this login is already registered',
      };
    }

    const userByEmail = await this.pgUsersRepository.isLoginOrEmailInUse(email);

    if (userByEmail) {
      return {
        field: 'email',
        message: 'user with this email is already registered',
      };
    }

    return null;
  }
}
