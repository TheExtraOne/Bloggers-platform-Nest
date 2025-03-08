import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../utils/email.service';
// import { UserDocument } from '../../../users/domain/user.entity';
// import { MgUsersRepository } from '../../../users/infrastructure/mg.users.repository';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { EmailConfirmationStatus } from 'src/features/user-accounts/users/domain/email-confirmation.schema';

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
    // private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: SendRecoverPasswordEmailCommand): Promise<void> {
    // For MongoDB
    // const user: UserDocument | null =
    //   await this.mgUsersRepository.findUserByLoginOrEmail(command.dto.email);

    // For Postgres
    const user: {
      id: string;
      confirmationStatus: EmailConfirmationStatus;
    } | null = await this.pgUsersRepository.findUserByEmail(command.dto.email);

    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = new ObjectId().toString();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    // For MongoDB
    // user.setNewPasswordRecoveryData({
    //   recoveryCode: newRecoveryCode,
    //   expirationDate: newExpirationDate,
    // });

    // await this.mgUsersRepository.save(user);

    // For Postgres
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
