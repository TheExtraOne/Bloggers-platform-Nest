import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { TimeService } from '../../../../../core/services/time.service';

export class UpdateSessionTimeCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly exp: number,
    public readonly iat: number,
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
    const { userId, deviceId, exp, iat } = command;
    const iatISO = this.timeService.convertUnixToISOString(iat);

    const session = await this.sessionsRepository.findSessionByMultipleFilters(
      userId,
      deviceId,
      iatISO,
    );

    if (!session) {
      return;
    }

    session.updateSessionTime({
      exp: this.timeService.convertUnixToISOString(exp),
      iat: iatISO,
    });

    await this.sessionsRepository.save(session);
  }
}
