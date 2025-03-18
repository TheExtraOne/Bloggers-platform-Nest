import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

export class DeleteSessionCommand extends Command<void> {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand, void>
{
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(command: DeleteSessionCommand): Promise<void> {
    // Find the session by deviceId
    const session = await this.pgSessionsRepository.findSessionByDeviceId(
      command.deviceId,
    );

    if (!session) {
      throw new Error('Session not found');
    }

    await this.pgSessionsRepository.deleteSessionByDeviceId(command.deviceId);
  }
}
