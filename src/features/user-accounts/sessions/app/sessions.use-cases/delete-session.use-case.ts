import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MgSessionsRepository } from '../../infrastructure/mg.sessions.repository';

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
  constructor(private readonly mgSessionsRepository: MgSessionsRepository) {}

  async execute(command: DeleteSessionCommand): Promise<void> {
    // Find the session by deviceId
    const session = await this.mgSessionsRepository.findSessionByDeviceId(
      command.deviceId,
    );

    if (!session) {
      throw new Error('Session not found');
    }

    session.makeDeleted();
    await this.mgSessionsRepository.save(session);
  }
}
