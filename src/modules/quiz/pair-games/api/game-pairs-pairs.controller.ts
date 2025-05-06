import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { ConnectUserCommand } from '../app/use-cases/connect-user.use-case';
import { GetGameByIdQuery } from '../app/queries/get-game-by-id.query';
import { ConnectUserSwagger } from './swagger/connect-user.swagger.decorator';
import { GetPairGameByIdSwagger } from './swagger/get-pair-game-by-id.swagger.decorator';
import { GetMyCurrentPairGameSwagger } from './swagger/get-my-current-pair-game.swagger.decorator';
import { GetMyPairGamesSwagger } from './swagger/get-my-pair-games.swagger.decorator';
import { PairViewDto } from './view-dto/game-pair.view-dto';
import { GetActiveGameByUserIdQuery } from '../app/queries/get-game-by-userid.query';
import { AnswerViewDto } from '../../answers/api/view-dto/answer.view-dto';
import { AnswerInputDto } from '../../answers/api/input-dto/answer.input-dto';
import { SetUserAnswerCommand } from '../../answers/app/use-cases/set-user-answer.use-case';
import { GetAnswerByIdQuery } from '../../answers/app/queries/get-answer-by-id.query';
import { SetUserAnswerSwagger } from './swagger/set-user-answer.swagger.decorator';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetAllGamesByUserIdQuery } from '../app/queries/get-all-games-by-userid.query';
import { GetAllUserGamesQueryParams } from './input-dto/get-all-user-games.input-dto';

@ApiTags('Pair Game Quiz')
@UseGuards(JwtAuthGuard)
@Controller(PATHS.PAIR_GAME_QUIZ_PAIRS)
export class GamePairsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my-current')
  @GetMyCurrentPairGameSwagger()
  @HttpCode(HttpStatus.OK)
  async getMyCurrentPairGame(
    @CurrentUserId() userId: string,
  ): Promise<PairViewDto> {
    return this.queryBus.execute(new GetActiveGameByUserIdQuery(userId));
  }

  @Get('my')
  @GetMyPairGamesSwagger()
  @HttpCode(HttpStatus.OK)
  async getMyPairGames(
    @CurrentUserId() userId: string,
    @Query() query: GetAllUserGamesQueryParams,
  ): Promise<PaginatedViewDto<PairViewDto[]>> {
    const pairGames = await this.queryBus.execute(
      new GetAllGamesByUserIdQuery(userId, query),
    );
    return pairGames;
  }

  @Get(':id')
  @GetPairGameByIdSwagger()
  @HttpCode(HttpStatus.OK)
  async getPairGameById(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<PairViewDto> {
    const pairGame = await this.queryBus.execute(
      new GetGameByIdQuery(id, userId),
    );
    return pairGame;
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  @ConnectUserSwagger()
  async connectUser(@CurrentUserId() userId: string): Promise<PairViewDto> {
    const { pairGameId } = await this.commandBus.execute(
      new ConnectUserCommand({ userId }),
    );

    return this.queryBus.execute(new GetGameByIdQuery(pairGameId, userId));
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  @SetUserAnswerSwagger()
  async setUserAnswer(
    @CurrentUserId() userId: string,
    @Body() answerDto: AnswerInputDto,
  ): Promise<AnswerViewDto> {
    const { answerId } = await this.commandBus.execute(
      new SetUserAnswerCommand({ userId, answerBody: answerDto.answer }),
    );

    return this.queryBus.execute(new GetAnswerByIdQuery(answerId));
  }
}
