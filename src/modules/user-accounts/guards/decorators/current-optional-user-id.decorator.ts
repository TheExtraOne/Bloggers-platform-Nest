import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
  };
}

export const CurrentOptionalUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    const request: RequestWithUser = context.switchToHttp().getRequest();

    return request?.user?.userId || null;
  },
);
