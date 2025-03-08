import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

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
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(
    command: ValidateRefreshTokenCommand,
    // ): Promise<SessionDocument | null> {
  ): Promise<{ id: string } | null> {
    const { userId, deviceId, iat } = command;
    // For MongoDB
    // return this.mgSessionsRepository.findSessionByMultipleFilters(
    //   userId,
    //   deviceId,
    //   convertUnixToDate(iat),
    // );

    // For PostgreSQL
    return this.pgSessionsRepository.findSessionByMultipleFilters(
      userId,
      deviceId,
      convertUnixToDate(iat),
    );
  }
}
