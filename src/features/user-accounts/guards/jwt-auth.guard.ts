import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomJwtService, TOKEN_TYPE } from '../app/custom-jwt.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';

// TODO: refactor
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private customJwtService: CustomJwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.customJwtService.verifyToken({
        token,
        type: TOKEN_TYPE.AC_TOKEN,
      });

      // TODO: refactor, should not take check from repository?
      // Check that such user exists
      const user = await this.usersQueryRepository.findUserById(
        payload?.userId,
      );
      if (!user) throw new UnauthorizedException();

      // We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
