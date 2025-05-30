import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomJwtService } from '../../../utils/custom-jwt.service';
import { v4 as uuidv4 } from 'uuid';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../../sessions/infrastructure/pg.sessions.repository';

export class LoginCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly title?: string,
    public readonly ip?: string,
  ) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginUseCases implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly customJwtService: CustomJwtService,
    private readonly pgSessionsRepository: PgSessionsRepository,
  ) {}

  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, title = 'Unknown device', ip = '::1' } = command;
    const deviceId = uuidv4();

    const accessToken: string = await this.customJwtService.createAccessToken({
      userId,
    });
    const refreshToken: string = await this.customJwtService.createRefreshToken(
      { userId, deviceId },
    );

    // Extracting exp and iat from refresh token
    const { exp, iat } =
      await this.customJwtService.extractTimeFromRefreshToken(refreshToken);

    // Creating new session
    const newRefreshTokenMeta = {
      deviceId,
      ip,
      title,
      lastActiveDate: convertUnixToDate(iat),
      expirationDate: convertUnixToDate(exp),
      userId,
    };
    await this.pgSessionsRepository.createSession(newRefreshTokenMeta);

    return { accessToken, refreshToken };
  }
}
