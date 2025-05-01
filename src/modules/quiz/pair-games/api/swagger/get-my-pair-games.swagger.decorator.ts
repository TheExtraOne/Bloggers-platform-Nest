import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { GamesSortBy } from '../input-dto/games-sort-by';
import { PaginatedPairGamesViewDto } from './paginated-pair-games.view-dto';

export function GetMyPairGamesSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all pair games for current user',
      description:
        'Returns paginated list of all pair games that current user participated in',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: GamesSortBy,
      description: 'Field to sort by',
    }),
    ApiQuery({
      name: 'sortDirection',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort direction',
    }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Number of items per page',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns paginated list of pair games',
      type: PaginatedPairGamesViewDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
