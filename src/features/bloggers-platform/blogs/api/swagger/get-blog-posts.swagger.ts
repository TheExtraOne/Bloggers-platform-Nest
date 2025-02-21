import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiProperty } from '@nestjs/swagger';
import { PostViewModel } from '../../../posts/api/swagger/posts.schema';

export class PaginatedPostsResponse {
  @ApiProperty({ type: [PostViewModel] })
  items: PostViewModel[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}

export const GetBlogPostsSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get all posts for a blog',
      description:
        'Returns a paginated list of all posts for a specific blog. Posts will include like status if user is authenticated.',
    })(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Blog ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved posts.',
      type: PaginatedPostsResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Blog not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
