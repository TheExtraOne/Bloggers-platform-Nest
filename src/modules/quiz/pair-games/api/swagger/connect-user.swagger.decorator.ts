import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PairViewDto } from '../view-dto/game-pair.view-dto';

export function ConnectUserSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Connect user to pair game quiz',
      description:
        'Connect current user to existing random pair or create new pair. Returns active pair.',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns connected pair game',
      type: PairViewDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'User is already participating in active pair',
    }),
  );
}
