import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../utils/email.service';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { EmailConfirmationStatus } from '../../../users/domain/enums/user.enums';

export class SendRecoverPasswordEmailCommand extends Command<void> {
  constructor(public readonly dto: PasswordRecoveryInputDto) {
    super();
  }
}

@CommandHandler(SendRecoverPasswordEmailCommand)
export class SendRecoverPasswordEmailUseCase
  implements ICommandHandler<SendRecoverPasswordEmailCommand, void>
{
  constructor(
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: SendRecoverPasswordEmailCommand): Promise<void> {
    const user: {
      id: string;
      confirmationStatus: EmailConfirmationStatus;
    } | null = await this.pgUsersRepository.findUserByEmail(command.dto.email);

    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = uuidv4();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    await this.pgUsersRepository.createNewPasswordRecoveryData(
      user.id,
      newRecoveryCode,
      newExpirationDate,
    );

    // Send recovery password letter
    this.emailService.sendRecoveryPasswordMail({
      userEmail: command.dto.email,
      recoveryCode: newRecoveryCode,
    });
  }
}
