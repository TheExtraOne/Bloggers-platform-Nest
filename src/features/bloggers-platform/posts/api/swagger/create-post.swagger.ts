import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBasicAuth } from '@nestjs/swagger';
import { PostViewModel } from './posts.schema';
import { APIErrorResultResponse } from '../../../../../features/user-accounts/users/api/swagger';

export const CreatePostSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Create new post',
      description: 'Creates a new post. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Post successfully created.',
      type: PostViewModel,
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
    return descriptor;
  };
};
