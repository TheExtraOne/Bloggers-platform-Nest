import {
  Command,
  CommandBus,
  CommandHandler,
  ICommandHandler,
} from '@nestjs/cqrs';
import {
  CustomJwtService,
  TOKEN_TYPE,
} from '../../../facades/custom-jwt.service';
import { UpdateSessionTimeCommand } from '../../../sessions/app/sessions.use-cases/update-session-time.use-case';

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
    private readonly commandBus: CommandBus,
    private readonly customJwtService: CustomJwtService,
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
    await this.commandBus.execute(
      new UpdateSessionTimeCommand(newExp, newIat, deviceId),
    );

    return { accessToken, refreshToken };
  }
}
