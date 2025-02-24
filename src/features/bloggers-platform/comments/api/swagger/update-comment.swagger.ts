import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CreateCommentInputModel } from './comment-input.schema';
import { APIErrorResultResponse } from '../../../../user-accounts/users/api/swagger';

export const UpdateCommentSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Update comment',
      description:
        'Updates a comment by ID. Only the owner can update their comment.',
    })(target, propertyKey, descriptor);
    ApiBearerAuth()(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Comment ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiBody({
      description: 'Updated comment data',
      type: CreateCommentInputModel,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Comment successfully updated.',
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
      status: HttpStatus.FORBIDDEN,
      description: 'User is not the owner of the comment.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Comment not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
