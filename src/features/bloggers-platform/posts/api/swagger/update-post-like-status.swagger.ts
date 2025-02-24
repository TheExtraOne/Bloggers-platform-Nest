import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { APIErrorResultResponse } from '../../../../../features/user-accounts/users/api/swagger';
import { UpdateLikeStatusInputModel } from '../../../likes/api/swagger/like-status-input.schema';

export const UpdatePostLikeStatusSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Update post like status',
      description:
        'Updates like status for a post. Requires JWT authentication.',
    })(target, propertyKey, descriptor);
    ApiBearerAuth()(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Post ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiBody({
      description: 'Like status data',
      type: UpdateLikeStatusInputModel,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Like status successfully updated.',
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
