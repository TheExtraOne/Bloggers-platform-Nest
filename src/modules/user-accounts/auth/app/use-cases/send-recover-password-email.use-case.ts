import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import {
  Command,
  CommandHandler,
  ICommandHandler,
  EventBus,
} from '@nestjs/cqrs';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { Users } from '../../../users/domain/entities/user.entity';
import { UserRecoveryEvent } from '../../../../notifications/events/send-recovery-email.event';

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
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SendRecoverPasswordEmailCommand): Promise<void> {
    const user: Users | null = await this.pgUsersRepository.findUserByEmail(
      command.dto.email,
    );

    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = uuidv4();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    await this.pgUsersRepository.createNewPasswordRecoveryData(
      user.id.toString(),
      newRecoveryCode,
      newExpirationDate,
    );

    // Send recovery password letter
    this.eventBus.publish(
      new UserRecoveryEvent(command.dto.email, newRecoveryCode),
    );
  }
}
