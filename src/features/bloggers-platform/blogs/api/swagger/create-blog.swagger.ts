import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBasicAuth } from '@nestjs/swagger';
import { BlogsViewDto } from '../view-dto/blogs.view-dto';
import { APIErrorResultResponse } from '../../../../../features/user-accounts/api/swagger/create-user.swagger';

export const CreateBlogSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Create new blog',
      description: 'Creates a new blog. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Blog successfully created.',
      type: BlogsViewDto,
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
    return descriptor;
  };
};
