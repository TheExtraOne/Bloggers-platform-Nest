import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationStatus } from '../../../users/domain/email-confirmation.schema';
import { ConfirmRegistrationInputDto } from '../../api/input-dto/confirm-registration.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';

export class ConfirmEmailRegistrationCommand extends Command<void> {
  constructor(public readonly dto: ConfirmRegistrationInputDto) {
    super();
  }
}

@CommandHandler(ConfirmEmailRegistrationCommand)
export class ConfirmEmailRegistrationUseCase
  implements ICommandHandler<ConfirmEmailRegistrationCommand, void>
{
  constructor(private readonly pgUsersRepository: PgUsersRepository) {}

  async execute(command: ConfirmEmailRegistrationCommand): Promise<void> {
    const user: {
      id: string;
      confirmationStatus: EmailConfirmationStatus;
      confirmationCode: string;
      expirationDate: Date;
    } | null = await this.pgUsersRepository.findUserByConfirmationCode(
      command.dto.code,
    );

    // Check if user with such confirmationCode exist
    if (!user) {
      throw new BadRequestException([
        { field: 'code', message: 'no user found' },
      ]);
    }
    // Check if confirmationCode has already been applied
    if (user.confirmationStatus === EmailConfirmationStatus.Confirmed) {
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);
    }

    // Check if confirmationCode expired
    if (user.expirationDate && user.expirationDate < new Date()) {
      throw new BadRequestException([
        { field: 'code', message: 'already expired' },
      ]);
    }

    await this.pgUsersRepository.confirmUserEmail(user.id);
  }
}
