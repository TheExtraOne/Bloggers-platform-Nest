import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiProperty } from '@nestjs/swagger';
import { CommentViewModel } from '../../../comments/api/swagger/comments.schema';

export class PaginatedCommentsResponse {
  @ApiProperty({ type: [CommentViewModel] })
  items: CommentViewModel[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}

export const GetPostCommentsSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get all comments for a post',
      description:
        'Returns a paginated list of all comments for a specific post. Comments will include like status if user is authenticated.',
    })(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Post ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved comments.',
      type: PaginatedCommentsResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Post not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
