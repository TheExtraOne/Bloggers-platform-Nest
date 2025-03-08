import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

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
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(command: DeleteAllSessionsCommand): Promise<void> {
    const { deviceId, userId } = command;

    // Deleting all sessions except current
    // For MongoDB
    // await this.mgSessionsRepository.deleteManySessionsByUserAndDeviceId(
    //   userId,
    //   deviceId,
    // );

    // For PostgreSQL
    await this.pgSessionsRepository.deleteManySessionsByUserAndDeviceId(
      userId,
      deviceId,
    );
  }
}
