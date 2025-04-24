import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PairViewDto } from '../view-dto/game-pair.view-dto';

export function GetMyCurrentPairGameSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user pair game',
      description: 'Get active or pending pair game for the current user',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns current active or pending pair game',
      type: PairViewDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 404,
      description: 'No active or pending game found',
    }),
  );
}
