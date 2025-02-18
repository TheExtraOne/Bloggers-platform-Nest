import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CheckIfUserIsAbleToLoginUseCase } from '../../app/users.use-cases/check-user-able-login.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private checkIfUserIsAbleToLoginUseCase: CheckIfUserIsAbleToLoginUseCase,
  ) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  // Validate method returns data that will be stored in req.user later
  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<{ userId: string }> {
    // TODO: move outside of the strategy?
    // Empty string validation is now handled by LocalAuthGuard
    const userId = await this.checkIfUserIsAbleToLoginUseCase.execute(
      loginOrEmail,
      password,
    );
    if (!userId) throw new UnauthorizedException();
    return { userId };
  }
}
