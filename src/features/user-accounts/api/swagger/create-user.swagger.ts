import { HttpStatus } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { UserViewDto } from '../view-dto/users.view-dto';

export class ErrorMessageResponse {
  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: String })
  field: string;
}

export class APIErrorResultResponse {
  @ApiProperty({ type: [ErrorMessageResponse] })
  errorsMessages: ErrorMessageResponse[];
}

export const CreateUserSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Create new user',
      description:
        'Creates a new user with unique login and email. Requires basic authentication. Will not send a confirmation email.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Successfully created user.',
      type: UserViewDto,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request',
      type: APIErrorResultResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
