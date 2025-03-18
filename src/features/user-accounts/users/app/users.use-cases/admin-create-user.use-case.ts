import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service';
import { EmailConfirmationStatus } from '../../infrastructure/pg.users.repository';

export class AdminCreateUserCommand {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {}
}

@CommandHandler(AdminCreateUserCommand)
export class AdminCreateUserUseCase
  implements ICommandHandler<AdminCreateUserCommand>
{
  constructor(private readonly usersService: UsersService) {}

  async execute(command: AdminCreateUserCommand) {
    const { login, email, password } = command.dto;

    const validationError = await this.usersService.validateUserCredentials(
      login,
      email,
    );
    if (validationError) {
      throw new BadRequestException([validationError]);
    }

    return await this.usersService.createUser({
      login,
      email,
      password,
      confirmationCode: null,
      expirationDate: null,
      confirmationStatus: EmailConfirmationStatus.Confirmed,
    });
  }
}
