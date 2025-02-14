import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TOKEN_TYPE } from '../../app/jwt.service';
import { Request } from 'express';

// TODO: refactor
export const ExtractUserFromHeader = createParamDecorator(
  (data: unknown, context: ExecutionContext): { userId: string } => {
    const request: Request = context.switchToHttp().getRequest();
    const jwtToken = request.headers['authorization'];
    const accessToken: string | undefined = jwtToken?.split(' ')[1];

    if (!accessToken) throw new UnauthorizedException();

    const userId: string = new JwtService().verifyToken({
      token: accessToken,
      type: TOKEN_TYPE.AC_TOKEN,
    });

    return { userId };
  },
);
