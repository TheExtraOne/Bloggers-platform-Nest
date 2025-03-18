import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { PgBlogsViewDto } from '../view-dto/blogs.view-dto';

export class PaginatedBlogsResponse {
  @ApiProperty({ type: [PgBlogsViewDto] })
  items: PgBlogsViewDto[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}

export const GetAllBlogsSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get all blogs',
      description:
        'Returns a paginated list of all blogs. Can be filtered by name and sorted.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved blogs.',
      type: PaginatedBlogsResponse,
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
