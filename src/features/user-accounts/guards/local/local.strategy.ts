import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CheckIfUserIsAbleToLoginCommand } from '../../users/app/users.use-cases/check-user-able-login.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly commandBus: CommandBus) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  // Validate method returns data that will be stored in req.user later
  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<{ userId: string }> {
    // Empty string validation is now handled by LocalAuthGuard
    const userId = await this.commandBus.execute(
      new CheckIfUserIsAbleToLoginCommand(loginOrEmail, password),
    );
    if (!userId) throw new UnauthorizedException();
    return { userId };
  }
}
