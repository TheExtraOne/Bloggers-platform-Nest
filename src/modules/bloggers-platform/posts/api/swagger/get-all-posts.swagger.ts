import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginatedPostsResponse } from '../../../blogs/api/swagger/get-blog-posts.swagger';

export const GetAllPostsSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get all posts',
      description:
        'Returns a paginated list of all posts. Posts will include like status if user is authenticated.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved posts.',
      type: PaginatedPostsResponse,
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
