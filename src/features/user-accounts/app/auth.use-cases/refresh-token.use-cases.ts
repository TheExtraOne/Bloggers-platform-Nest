import { CustomJwtService, TOKEN_TYPE } from '../facades/custom-jwt.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
  constructor(private readonly customJwtService: CustomJwtService) {}

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

    return { accessToken, refreshToken };
  }
}
