import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationStatus } from '../../domain/email-confirmation.schema';
import { UsersService } from '../users.service';

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
