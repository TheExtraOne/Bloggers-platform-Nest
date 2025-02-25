import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class DeleteAllSessionsCommand extends Command<void> {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteAllSessionsCommand)
export class DeleteAllSessionsUseCase
  implements ICommandHandler<DeleteAllSessionsCommand, void>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteAllSessionsCommand): Promise<void> {
    const { deviceId, userId } = command;

    // Deleting all sessions except current
    await this.sessionsRepository.deleteManySessionsByUserAndDeviceId(
      userId,
      deviceId,
    );
  }
}
