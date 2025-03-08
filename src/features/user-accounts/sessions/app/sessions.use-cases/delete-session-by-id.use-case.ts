import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ERRORS } from '../../../../../constants';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

export class DeleteSessionByIdCommand extends Command<void> {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteSessionByIdCommand)
export class DeleteSessionByIdUseCase
  implements ICommandHandler<DeleteSessionByIdCommand, void>
{
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(command: DeleteSessionByIdCommand): Promise<void> {
    const { deviceId, userId } = command;

    // Find the session by deviceId
    // For MongoDB
    // const session =
    //   await this.mgSessionsRepository.findSessionByDeviceId(deviceId);

    // For PostgreSQL
    const session: {
      userId: string;
    } | null = await this.pgSessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    // If try to delete the deviceId of other user
    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    // For MongoDB
    // session.makeDeleted();
    // await this.mgSessionsRepository.save(session);

    // For PostgreSQL
    await this.pgSessionsRepository.deleteSessionByDeviceId(deviceId);
  }
}
