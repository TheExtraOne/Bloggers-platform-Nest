import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../users/api/swagger/create-user.swagger';

export const RegistrationEmailResendingSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Resend registration confirmation email',
      description:
        'Resends the registration confirmation email with a new confirmation code.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Confirmation email successfully resent.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid email or email already confirmed.',
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
