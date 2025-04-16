import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomJwtService } from '../../../utils/custom-jwt.service';
import { PgSessionsRepository } from '../../../sessions/infrastructure/pg.sessions.repository';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';

export class RefreshTokenCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCases
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly customJwtService: CustomJwtService,
    private readonly pgSessionsRepository: PgSessionsRepository,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, deviceId } = command;

    // Create pair of new access and refresh tokens
    const accessToken: string = await this.customJwtService.createAccessToken({
      userId,
    });
    const refreshToken: string = await this.customJwtService.createRefreshToken(
      {
        userId,
        deviceId,
      },
    );

    // Extracting exp and iat from refresh token
    const { exp: newExp, iat: newIat } =
      await this.customJwtService.extractTimeFromRefreshToken(refreshToken);

    // Updating session: sliding expiration time
    await this.pgSessionsRepository.updateSessionTime(
      deviceId,
      convertUnixToDate(newExp),
      convertUnixToDate(newIat),
    );

    return { accessToken, refreshToken };
  }
}
