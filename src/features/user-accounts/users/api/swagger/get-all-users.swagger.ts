import { HttpStatus } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { UserViewDto } from '../view-dto/users.view-dto';

export class PaginatedUsersResponse {
  @ApiProperty({ type: [UserViewDto] })
  items: UserViewDto[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}

export const GetAllUsersSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Get all users',
      description:
        'Returns a paginated list of all users. Requires basic authentication.',
    })(target, propertyKey, descriptor);
    ApiBasicAuth('basicAuth')(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved users.',
      type: PaginatedUsersResponse,
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
