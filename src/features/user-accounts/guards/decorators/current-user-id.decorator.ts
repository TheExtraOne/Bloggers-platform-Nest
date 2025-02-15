import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
  };
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    if (!request.user?.userId)
      throw new Error('JwtGuard or LocalGuard must be used');

    return request.user?.userId;
  },
);
