import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class DeleteSessionCommand extends Command<void> {
  constructor(public readonly deviceId: string) {
    super();
  }
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand, void>
{
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(command: DeleteSessionCommand): Promise<void> {
    // Find the session by deviceId
    const session = await this.sessionsRepository.findSessionByDeviceId(
      command.deviceId,
    );

    if (!session) {
      throw new Error('Session not found');
    }

    session.makeDeleted();
    await this.sessionsRepository.save(session);
  }
}
