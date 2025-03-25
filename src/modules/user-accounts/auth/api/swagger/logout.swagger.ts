import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../users/api/swagger/create-user.swagger';

export const LogoutSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Logout user from the system',
      description:
        'Terminates the current user session and invalidates the refresh token',
    })(target, propertyKey, descriptor);

    ApiBearerAuth()(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'User has been successfully logged out',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'JWT refresh token is missing, expired or invalid',
      type: APIErrorResultResponse,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
};
