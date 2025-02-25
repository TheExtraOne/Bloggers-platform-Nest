import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { UnauthorizedException } from '@nestjs/common';

export class DeleteSessionCommand extends Command<void> {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
    public readonly iat: number,
  ) {
    super();
  }
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand, void>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteSessionCommand): Promise<void> {
    const { deviceId, userId, iat } = command;
    // Check that token is valid
    const result =
      await this.sessionsRepository.findAllSessionsByMultipleFilters(
        userId,
        deviceId,
        this.convertTimeToISOFromUnix(iat),
      );
    if (!result) {
      throw new UnauthorizedException();
    }
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

  private convertTimeToISOFromUnix(unixTime: number): string {
    return new Date(unixTime * 1000).toISOString();
  }
}
