import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiBody,
} from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../users/api/swagger/create-user.swagger';
import { LoginInputDto } from '../input-dto/login.input-dto';

export class LoginResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;
}

export const LoginSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Login user',
      description:
        'Authenticates user and returns JWT tokens. Access token in response body, refresh token in cookie.',
    })(target, propertyKey, descriptor);
    ApiBody({ type: LoginInputDto })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully authenticated.',
      type: LoginResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data.',
      type: APIErrorResultResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
