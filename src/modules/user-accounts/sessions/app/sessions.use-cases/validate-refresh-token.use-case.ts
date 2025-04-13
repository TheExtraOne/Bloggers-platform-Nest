import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';
import { Sessions } from '../../domain/entities/session.entity';

export class ValidateRefreshTokenCommand extends Command<Sessions | null> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly iat: number,
  ) {
    super();
  }
}

@CommandHandler(ValidateRefreshTokenCommand)
export class ValidateRefreshTokenUseCase
  implements ICommandHandler<ValidateRefreshTokenCommand>
{
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(
    command: ValidateRefreshTokenCommand,
  ): Promise<Sessions | null> {
    const { userId, deviceId, iat } = command;
    return this.pgSessionsRepository.findSessionByMultipleFilters(
      userId,
      deviceId,
      convertUnixToDate(iat),
    );
  }
}
