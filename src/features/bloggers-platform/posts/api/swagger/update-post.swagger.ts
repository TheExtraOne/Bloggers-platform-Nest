import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBasicAuth,
  ApiParam,
} from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../../../features/user-accounts/users/api/swagger';

export const UpdatePostSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Update post',
      description:
        'Updates an existing post by ID. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Post ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Post successfully updated.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data.',
      type: APIErrorResultResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Post not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
