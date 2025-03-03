import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../facades/email.service';
import { PasswordRecoveryStatus } from '../../../users/domain/password-recovery.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';

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
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: SendRecoverPasswordEmailCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(command.dto.email);
    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = new ObjectId().toString();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    user.setNewPasswordRecoveryData({
      recoveryCode: newRecoveryCode,
      expirationDate: newExpirationDate,
    });

    await this.usersRepository.save(user);

    // Send recovery password letter
    this.emailService.sendRecoveryPasswordMail({
      userEmail: command.dto.email,
      recoveryCode: newRecoveryCode,
    });
  }
}
