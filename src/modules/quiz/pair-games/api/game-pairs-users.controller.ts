import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { PATHS } from '../../../../constants';
import { UserStatisticViewDto } from './view-dto/user-statistic.view-dto';
import { GetUserStatisticQuery } from '../app/queries/get-user-statistic.query';
import { GetMyStatisticSwagger } from './swagger/get-my-statistic.swagger.decorator';

@ApiTags('Pair Game Quiz')
@ApiBasicAuth()
@UseGuards(JwtAuthGuard)
@Controller(PATHS.PAIR_GAME_QUIZ_USERS)
export class GameUsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('my-statistic')
  @GetMyStatisticSwagger()
  @HttpCode(HttpStatus.OK)
  async getMyStatistic(
    @CurrentUserId() userId: string,
  ): Promise<UserStatisticViewDto> {
    return await this.queryBus.execute(new GetUserStatisticQuery(userId));
  }
}
