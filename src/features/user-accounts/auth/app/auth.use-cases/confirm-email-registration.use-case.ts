import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationStatus } from '../../../users/domain/email-confirmation.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { MgUsersRepository } from '../../../users/infrastructure/mg.users.repository';
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
  constructor(
    private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
  ) {}

  async execute(command: ConfirmEmailRegistrationCommand): Promise<void> {
    // For MongoDB
    // const user: UserDocument | null =
    //   await this.mgUsersRepository.findUserByConfirmationCode(command.dto.code);

    // For Postgres
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

    // If ok, then updating user flag
    // For MongoDB
    // user.confirmEmail();
    // await this.mgUsersRepository.save(user);

    // For Postgres
    await this.pgUsersRepository.confirmUserEmail(user.id);
  }
}
