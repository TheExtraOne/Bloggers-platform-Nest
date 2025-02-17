import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../app/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
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
    const userId = await this.authService.validateUser(loginOrEmail, password);
    if (!userId) throw new UnauthorizedException();
    return { userId };
  }
}
