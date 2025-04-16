import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../email.service';

export class UserRegisteredEvent {
  constructor(
    public readonly email: string,
    public confirmationCode: string,
  ) {}
}

@EventsHandler(UserRegisteredEvent)
export class SendRegistrationEmailEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: UserRegisteredEvent) {
    try {
      await this.emailService.sendRegistrationMail({
        email: event.email,
        confirmationCode: event.confirmationCode,
      });
    } catch (e) {
      console.error('send email', e);
    }
  }
}
