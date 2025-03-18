import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

type TCreateSessionInputDto = {
  exp: number;
  iat: number;
  title?: string;
  ip?: string;
  deviceId: string;
  userId: string;
};

export class CreateSessionCommand extends Command<void> {
  constructor(public readonly dto: TCreateSessionInputDto) {
    super();
  }
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand, void>
{
  constructor(private readonly pgSessionsRepository: PgSessionsRepository) {}

  async execute(command: CreateSessionCommand): Promise<void> {
    const {
      exp,
      iat,
      title = 'Unknown device',
      ip = '::1',
      deviceId,
      userId,
    } = command.dto;

    const newRefreshTokenMeta = {
      deviceId,
      ip,
      title,
      lastActiveDate: convertUnixToDate(iat),
      expirationDate: convertUnixToDate(exp),
      userId,
    };

    await this.pgSessionsRepository.createSession(newRefreshTokenMeta);
  }
}
