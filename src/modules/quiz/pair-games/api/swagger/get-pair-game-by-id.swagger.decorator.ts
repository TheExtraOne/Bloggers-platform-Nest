import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PairViewDto } from '../view-dto/game-pair.view-dto';

export function GetPairGameByIdSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get pair game by id',
      description: 'Get pair game by id. User should be participant of this game',
    }),
    ApiParam({
      name: 'id',
      description: 'Pair game id',
      type: String,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Returns pair game',
      type: PairViewDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'User is not participating in this game',
    }),
  );
}
