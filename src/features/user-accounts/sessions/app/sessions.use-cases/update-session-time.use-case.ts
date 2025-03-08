import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { MgSessionsRepository } from '../../infrastructure/mg.sessions.repository';
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
  constructor(
    // private readonly mgSessionsRepository: MgSessionsRepository,
    private readonly pgSessionsRepository: PgSessionsRepository,
  ) {}

  async execute(command: UpdateSessionTimeCommand): Promise<void> {
    const { newExp, newIat, deviceId } = command;

    // For MongoDB
    // const session =
    //   await this.mgSessionsRepository.findSessionByDeviceId(deviceId);

    // For PostgreSQL
    const session: { userId: string } | null =
      await this.pgSessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      return;
    }
    // For MongoDB
    // session.updateSessionTime({
    //   exp: convertUnixToDate(newExp),
    //   iat: convertUnixToDate(newIat),
    // });
    // await this.mgSessionsRepository.save(session);

    // For PostgreSQL
    await this.pgSessionsRepository.updateSessionTime(
      deviceId,
      convertUnixToDate(newExp),
      convertUnixToDate(newIat),
    );
  }
}
