import { HttpStatus } from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const DeleteUserSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Delete user',
      description: 'Deletes a user by their ID. Requires basic authentication. This operation cannot be undone.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      type: String,
      description: 'User ID to delete',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Successfully deleted user.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
