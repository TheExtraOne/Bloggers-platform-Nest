import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { PATHS } from '../../../../constants';
import { UserStatisticViewDto } from './view-dto/user-statistic.view-dto';
import { GetUserStatisticQuery } from '../app/queries/get-user-statistic.query';
import { GetMyStatisticSwagger } from './swagger/get-my-statistic.swagger.decorator';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetTopUsersQueryParams } from './input-dto/get-top-users.input-dto';
import { TopUserViewDto } from './view-dto/top-user.view-dto';
import { GetTopUsersQuery } from '../app/queries/get-top-users.query';
import { GetTopUsersSwagger } from './swagger/get-top-users.swagger.decorator';

@ApiTags('Pair Game Quiz')
@Controller(PATHS.PAIR_GAME_QUIZ_USERS)
export class GameUsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('my-statistic')
  @UseGuards(JwtAuthGuard)
  @GetMyStatisticSwagger()
  @HttpCode(HttpStatus.OK)
  async getMyStatistic(
    @CurrentUserId() userId: string,
  ): Promise<UserStatisticViewDto> {
    return await this.queryBus.execute(new GetUserStatisticQuery(userId));
  }

  @Get('top')
  @HttpCode(HttpStatus.OK)
  @GetTopUsersSwagger()
  async getTopUsers(
    @Query() query: GetTopUsersQueryParams,
  ): Promise<PaginatedViewDto<TopUserViewDto[]>> {
    return await this.queryBus.execute(new GetTopUsersQuery(query));
  }
}
