import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService, TOKEN_TYPE } from '../app/jwt.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';

// TODO: refactor
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const bearerJWT: string | undefined = request.headers['authorization'];

    if (!bearerJWT) {
      throw new UnauthorizedException();
    }

    const accessToken: string = bearerJWT.split(' ')[1];
    const userId: string = this.jwtService.verifyToken({
      token: accessToken,
      type: TOKEN_TYPE.AC_TOKEN,
    });

    const user = await this.usersQueryRepository.findUserById(userId);

    if (!user) throw new UnauthorizedException();
    return true;
  }
}
