import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../app/auth.service';
import { LoginInputDto } from '../../api/input-dto/login.input-dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail' });
  }

  // Validate method returns data that will be stored in req.user later
  async validate(loginOrEmail: string, password: string): Promise<string> {
    // Validating incoming parameters
    const loginDto = plainToInstance(LoginInputDto, { loginOrEmail, password });
    const errors = await validate(loginDto);

    if (errors.length > 0) {
      throw new BadRequestException(
        errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
        })),
      );
    }

    const userId = await this.authService.validateUser(loginOrEmail, password);
    if (!userId) throw new UnauthorizedException();

    return userId;
  }
}
