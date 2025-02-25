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
import { SessionsRepository } from 'src/features/user-accounts/sessions/infrastructure/sessions.repository';
import { UnauthorizedException } from '@nestjs/common';

export class RefreshTokenCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly iat: number,
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
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, deviceId, iat } = command;
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

    // Create pair of new access and refresh tokens
    const accessToken: string = await this.customJwtService.createToken({
      payload: { userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    const refreshToken: string = await this.customJwtService.createToken({
      payload: { userId, deviceId },
      type: TOKEN_TYPE.R_TOKEN,
    });

    // Extracting exp and iat from refresh token
    const { exp, iat: newIat } =
      await this.customJwtService.extractTimeFromRefreshToken(refreshToken);
    // Updating session
    await this.commandBus.execute(
      new UpdateSessionTimeCommand(exp, newIat, deviceId),
    );

    return { accessToken, refreshToken };
  }
  // TODO: refactor, this function is defined is multiple places
  private convertTimeToISOFromUnix(unixTime: number): string {
    return new Date(unixTime * 1000).toISOString();
  }
}
