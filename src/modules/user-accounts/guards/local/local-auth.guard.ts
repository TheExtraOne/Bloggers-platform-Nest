import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { LoginInputDto } from '../../auth/api/input-dto/login.input-dto';
import { validate } from 'class-validator';
import { ExecutionContext } from '@nestjs/common';

// Guard for login: via local strategy we check login/email and password of the user
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { loginOrEmail, password } = request.body;

    // Validate using class-validator
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

    // If validation passes, proceed with authentication
    return super.canActivate(context) as Promise<boolean>;
  }
}
