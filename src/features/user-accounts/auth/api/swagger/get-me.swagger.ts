import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';

export class MeResponse {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'johndoe' })
  login: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;
}

export const GetMeSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get information about current user',
      description:
        'Returns information about the currently authenticated user. Requires JWT authentication.',
    })(target, propertyKey, descriptor);
    ApiBearerAuth()(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved user information.',
      type: MeResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User is not authenticated.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
