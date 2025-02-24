import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { ERRORS } from '../../../../../constants';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteSessionByIdCommand): Promise<void> {
    const { deviceId, userId } = command;

    // Find the session by deviceId
    const session =
      await this.sessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    // If try to delete the deviceId of other user
    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    session.makeDeleted();
    await this.sessionsRepository.save(session);
  }
}
