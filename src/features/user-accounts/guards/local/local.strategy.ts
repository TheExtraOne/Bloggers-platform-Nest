import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../app/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail' });
  }

  // Validate method returns data that will be stored in req.user later
  async validate(loginOrEmail: string, password: string): Promise<string> {
    // TODO: normal validation
    this.validateField(loginOrEmail, 'loginOrEmail');
    this.validateField(password, 'password');

    const userId = await this.authService.validateUser(loginOrEmail, password);
    if (!userId) throw new UnauthorizedException();

    return userId;
  }

  private validateField(field: string, filedName: string) {
    if (
      !field ||
      typeof field !== 'string' ||
      (typeof field === 'string' && !field.trim().length)
    ) {
      throw new BadRequestException([
        { field: filedName, message: 'should be not empty' },
      ]);
    }
  }
}
