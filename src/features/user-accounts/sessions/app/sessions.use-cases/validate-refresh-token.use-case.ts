import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { SessionDocument } from '../../domain/session.entity';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';

export class ValidateRefreshTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly iat: number,
  ) {}
}

@CommandHandler(ValidateRefreshTokenCommand)
export class ValidateRefreshTokenUseCase
  implements ICommandHandler<ValidateRefreshTokenCommand>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(
    command: ValidateRefreshTokenCommand,
  ): Promise<SessionDocument | null> {
    const { userId, deviceId, iat } = command;
    return this.sessionsRepository.findSessionByMultipleFilters(
      userId,
      deviceId,
      convertUnixToDate(iat),
    );
  }
}
