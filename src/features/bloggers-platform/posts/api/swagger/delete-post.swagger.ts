import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBasicAuth, ApiParam } from '@nestjs/swagger';

export const DeletePostSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Delete post',
      description: 'Deletes a post by ID. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Post ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Post successfully deleted.',
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
