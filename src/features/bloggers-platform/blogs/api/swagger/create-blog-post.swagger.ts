import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBasicAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PostViewModel } from '../../../posts/api/swagger/posts.schema';
import { APIErrorResultResponse } from '../../../../user-accounts/users/api/swagger';

export const CreateBlogPostSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Create new post for blog',
      description:
        'Creates a new post for a specific blog. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Blog ID',
      type: String,
    })(target, propertyKey, descriptor);
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
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Blog not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
