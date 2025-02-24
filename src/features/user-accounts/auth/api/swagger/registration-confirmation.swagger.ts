import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../users/api/swagger/create-user.swagger';

export const RegistrationConfirmationSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Confirm user registration',
      description:
        'Confirms user registration using the code received via email.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Registration successfully confirmed.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'If the confirmation code is incorrect, expired or already been applied.',
      type: APIErrorResultResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description:
        'More than 5 attempts from one IP-address during 10 seconds.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
