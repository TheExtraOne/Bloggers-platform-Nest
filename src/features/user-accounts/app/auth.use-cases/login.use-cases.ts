import { ObjectId } from 'mongodb';
import { CustomJwtService, TOKEN_TYPE } from '../facades/custom-jwt.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LoginCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(public readonly userId: string) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginUseCases implements ICommandHandler<LoginCommand> {
  constructor(private readonly customJwtService: CustomJwtService) {}

  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken: string = await this.customJwtService.createToken({
      payload: { userId: command.userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    const refreshToken: string = await this.customJwtService.createToken({
      payload: { userId: command.userId, deviceId: new ObjectId().toString() },
      type: TOKEN_TYPE.R_TOKEN,
    });

    return { accessToken, refreshToken };
  }
}
