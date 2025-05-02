import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserStatisticViewDto } from '../view-dto/user-statistic.view-dto';

export function GetMyStatisticSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user game statistics',
      description: "Returns statistics about user's game performance",
    }),
    ApiResponse({
      status: 200,
      description: 'Success',
      type: UserStatisticViewDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
