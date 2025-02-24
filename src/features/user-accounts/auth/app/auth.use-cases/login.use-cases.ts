import { ObjectId } from 'mongodb';
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
import { CreateSessionCommand } from '../../../sessions/app/sessions.use-cases/create-session.use-case';

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
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, title, ip } = command;
    const deviceId = new ObjectId().toString();

    const accessToken: string = await this.customJwtService.createToken({
      payload: { userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    const refreshToken: string = await this.customJwtService.createToken({
      payload: { userId, deviceId },
      type: TOKEN_TYPE.R_TOKEN,
    });

    // Extracting exp and iat from refresh token
    const { exp, iat } =
      await this.customJwtService.extractTimeFromRefreshToken(refreshToken);
    // Creating new session
    await this.commandBus.execute(
      new CreateSessionCommand({
        exp,
        iat,
        title,
        ip,
        deviceId,
        userId,
      }),
    );

    return { accessToken, refreshToken };
  }
}
