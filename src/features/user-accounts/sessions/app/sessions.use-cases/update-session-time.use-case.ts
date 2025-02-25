import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class UpdateSessionTimeCommand extends Command<void> {
  constructor(
    public readonly exp: number,
    public readonly iat: number,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(UpdateSessionTimeCommand)
export class UpdateSessionTimeUseCase
  implements ICommandHandler<UpdateSessionTimeCommand, void>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(command: UpdateSessionTimeCommand): Promise<void> {
    const { exp, iat, deviceId } = command;

    // Find the session by deviceId
    const session =
      await this.sessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new Error('Session not found');
    }

    session.updateSessionTime({
      exp: this.convertTimeToISOFromUnix(exp),
      iat: this.convertTimeToISOFromUnix(iat),
    });
    await this.sessionsRepository.save(session);
  }
  // TODO: move to utils
  private convertTimeToISOFromUnix(unixTime: number): string {
    return new Date(unixTime * 1000).toISOString();
  }
}
