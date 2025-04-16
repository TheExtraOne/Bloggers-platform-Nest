import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../email.service';

export class UserRecoveryEvent {
  constructor(
    public readonly email: string,
    public recoveryCode: string,
  ) {}
}

@EventsHandler(UserRecoveryEvent)
export class SendRecoveryEmailEventHandler
  implements IEventHandler<UserRecoveryEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: UserRecoveryEvent) {
    try {
      await this.emailService.sendRecoveryPasswordMail({
        userEmail: event.email,
        recoveryCode: event.recoveryCode,
      });
    } catch (e) {
      console.error('send email', e);
    }
  }
}
