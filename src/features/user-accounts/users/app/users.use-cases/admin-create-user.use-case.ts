import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service';
import {
  CreateUserDomainDto,
  EmailConfirmationStatus,
  PgUsersRepository,
} from '../../infrastructure/pg.users.repository';
import { BcryptService } from '../../../utils/bcrypt.service';

export class AdminCreateUserCommand {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {}
}

@CommandHandler(AdminCreateUserCommand)
export class AdminCreateUserUseCase
  implements ICommandHandler<AdminCreateUserCommand>
{
  constructor(
    private readonly usersService: UsersService,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: AdminCreateUserCommand) {
    const { login, email, password } = command.dto;

    const validationError = await this.usersService.validateUserCredentials(
      login,
      email,
    );
    if (validationError) {
      throw new BadRequestException([validationError]);
    }

    const passwordHash = await this.bcryptService.hashPassword(password);

    const createUserDto: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
      confirmationCode: null,
      expirationDate: null,
      confirmationStatus: EmailConfirmationStatus.Confirmed,
    };

    return await this.pgUsersRepository.createUser(createUserDto);
  }
}
