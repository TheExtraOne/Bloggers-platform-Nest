import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    deviceId: string;
  };
}

export const CurrentUserDeviceIdAndUserId = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): { userId: string; deviceId: string } => {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    if (!request.user?.userId || !request.user?.deviceId)
      throw new Error('RefreshTokenGuard must be used');

    return { userId: request.user?.userId, deviceId: request.user?.deviceId };
  },
);
