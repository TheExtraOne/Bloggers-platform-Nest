import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BlogsViewDto } from '../view-dto/blogs.view-dto';

export const GetBlogByIdSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get blog by ID',
      description: 'Returns a single blog by its ID.',
    })(target, propertyKey, descriptor);
    ApiParam({
      name: 'id',
      description: 'Blog ID',
      type: String,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved blog.',
      type: BlogsViewDto,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Blog not found.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
