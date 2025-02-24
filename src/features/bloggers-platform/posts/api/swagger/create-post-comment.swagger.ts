import { HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CommentViewModel } from '../../../comments/api/swagger/comments.schema';
import { CreateCommentInputModel } from '../../../comments/api/swagger/comment-input.schema';
import { APIErrorResultResponse } from '../../../../../features/user-accounts/users/api/swagger';

export const CreatePostCommentSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Create new comment for post',
      description:
        'Creates a new comment for a specific post. Requires JWT authentication.',
    })(target, propertyKey, descriptor);
    ApiBearerAuth('JWT')(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Post ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiBody({
      description: 'Comment data',
      type: CreateCommentInputModel,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Comment successfully created.',
      type: CommentViewModel,
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
