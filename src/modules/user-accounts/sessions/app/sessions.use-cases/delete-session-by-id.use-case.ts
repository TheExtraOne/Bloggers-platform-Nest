import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ERRORS } from '../../../../../constants';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';
import { Sessions } from '../../domain/entities/session.entity';

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

    const session: Sessions | null =
      await this.pgSessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    // If try to delete the deviceId of other user
    if (session.user.id.toString() !== userId) {
      throw new ForbiddenException();
    }

    await this.pgSessionsRepository.deleteSessionByDeviceId(deviceId);
  }
}
