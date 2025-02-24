import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationStatus } from '../../../users/domain/email-confirmation.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { ConfirmRegistrationInputDto } from '../../api/input-dto/confirm-registration.input-dto';

export class ConfirmEmailRegistrationCommand extends Command<void> {
  constructor(public readonly dto: ConfirmRegistrationInputDto) {
    super();
  }
}

@CommandHandler(ConfirmEmailRegistrationCommand)
export class ConfirmEmailRegistrationUseCase
  implements ICommandHandler<ConfirmEmailRegistrationCommand, void>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: ConfirmEmailRegistrationCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByConfirmationCode(command.dto.code);
    // Check if user with such confirmationCode exist
    if (!user)
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if confirmationCode has already been applied
    if (
      user.emailConfirmation.confirmationStatus ===
      EmailConfirmationStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if confirmationCode expired
    if (user.emailConfirmation.expirationDate < new Date())
      throw new BadRequestException([
        { field: 'code', message: 'already expired' },
      ]);

    // If ok, then updating user flag
    user.updateEmailConfirmation({ status: EmailConfirmationStatus.Confirmed });

    await this.usersRepository.save(user);
  }
}
