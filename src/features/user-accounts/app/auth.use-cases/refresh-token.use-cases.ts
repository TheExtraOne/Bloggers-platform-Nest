import { CustomJwtService, TOKEN_TYPE } from '../facades/custom-jwt.service';
import {
  Command,
  CommandBus,
  CommandHandler,
  ICommandHandler,
} from '@nestjs/cqrs';
import { UpdateSessionTimeCommand } from '../sessions.use-cases/update-session-time.use-case';

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
    const accessToken: string = await this.customJwtService.createToken({
      payload: { userId: command.userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    const refreshToken: string = await this.customJwtService.createToken({
      payload: { userId: command.userId, deviceId: command.deviceId },
      type: TOKEN_TYPE.R_TOKEN,
    });

    // Extracting exp and iat from refresh token
    const { exp, iat } =
      await this.customJwtService.extractTimeFromRefreshToken(refreshToken);
    // Updating session
    await this.commandBus.execute(
      new UpdateSessionTimeCommand(exp, iat, command.deviceId),
    );

    return { accessToken, refreshToken };
  }
}
