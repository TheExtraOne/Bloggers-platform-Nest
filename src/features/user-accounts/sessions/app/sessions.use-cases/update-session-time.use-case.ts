import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { TimeService } from '../../../../../core/services/time.service';

export class UpdateSessionTimeCommand extends Command<void> {
  constructor(
    public readonly newExp: number,
    public readonly newIat: number,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(UpdateSessionTimeCommand)
export class UpdateSessionTimeUseCase
  implements ICommandHandler<UpdateSessionTimeCommand>
{
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly timeService: TimeService,
  ) {}

  async execute(command: UpdateSessionTimeCommand): Promise<void> {
    const { newExp, newIat, deviceId } = command;

    const session =
      await this.sessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      return;
    }

    session.updateSessionTime({
      exp: this.timeService.convertUnixToDate(newExp),
      iat: this.timeService.convertUnixToDate(newIat),
    });

    await this.sessionsRepository.save(session);
  }
}
