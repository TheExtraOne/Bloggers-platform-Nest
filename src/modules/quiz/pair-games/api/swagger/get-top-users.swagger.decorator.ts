import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TopUsersPaginatedSwagger } from './top-users.paginated.swagger';

export function GetTopUsersSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get top users by their game statistics',
      description:
        'Returns paginated list of users sorted by their game performance',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      isArray: true,
      description:
        'Sort parameters in format "field direction" (e.g., "avgScores desc")',
      example: ['avgScores desc', 'sumScore desc'],
    }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Success',
      type: TopUsersPaginatedSwagger,
    }),
  );
}
