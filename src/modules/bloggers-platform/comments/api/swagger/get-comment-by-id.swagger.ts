import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommentViewModel } from './comments.schema';

export const GetCommentByIdSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get comment by ID',
      description: 'Returns a comment by ID. Like status will be included if user is authenticated.',
    })(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Comment ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Comment found and returned.',
      type: CommentViewModel,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Comment not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
