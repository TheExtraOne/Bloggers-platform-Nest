import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';

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
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async execute(command: DeleteAllSessionsCommand): Promise<void> {
    const { deviceId, userId } = command;

    // TODO: move to repository
    // Deleting all sessions except current
    await this.SessionModel.updateMany(
      { userId, deviceId: { $ne: deviceId }, deletedAt: null },
      { deletedAt: new Date() },
    );
  }
}
