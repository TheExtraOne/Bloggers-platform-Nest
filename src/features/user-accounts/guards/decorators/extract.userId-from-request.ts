import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService, TOKEN_TYPE } from '../../app/jwt.service';

// TODO: refactor
export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): { userId: string } => {
    const request = context.switchToHttp().getRequest();
    const jwtToken = request.headers['authorization'];
    const accessToken: string = jwtToken.split(' ')[1];

    const userId: string = new JwtService().verifyToken({
      token: accessToken,
      type: TOKEN_TYPE.AC_TOKEN,
    });

    return { userId };
  },
);
