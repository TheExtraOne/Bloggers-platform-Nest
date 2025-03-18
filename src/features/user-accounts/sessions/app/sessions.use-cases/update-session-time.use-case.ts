import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

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
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(command: UpdateSessionTimeCommand): Promise<void> {
    const { newExp, newIat, deviceId } = command;

    const session: { userId: string } | null =
      await this.pgSessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      return;
    }

    await this.pgSessionsRepository.updateSessionTime(
      deviceId,
      convertUnixToDate(newExp),
      convertUnixToDate(newIat),
    );
  }
}
