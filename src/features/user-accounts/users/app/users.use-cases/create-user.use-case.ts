import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { EmailConfirmationStatus } from '../../domain/email-confirmation.schema';
import { EmailService } from '../../../../user-accounts/facades/email.service';
import { UsersService } from '../users.service';

export class CreateUserCommand {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: CreateUserCommand) {
    const { login, email, password } = command.dto;

    const validationError = await this.usersService.validateUserCredentials(
      login,
      email,
    );
    if (validationError) {
      throw new BadRequestException([validationError]);
    }
    const confirmationCode = new ObjectId().toString();
    const expirationDate = add(new Date(), { hours: 1, minutes: 30 });

    const result = await this.usersService.createUser({
      login,
      email,
      password,
      confirmationCode,
      expirationDate,
      confirmationStatus: EmailConfirmationStatus.Pending,
    });

    // Send confirmation email
    this.emailService.sendRegistrationMail({
      email: email,
      confirmationCode: confirmationCode,
    });

    return result;
  }
}
