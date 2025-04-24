import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { ConnectUserCommand } from '../app/use-cases/connect-user.use-case';
import { GetGameByIdQuery } from '../app/queries/get-game-by-id.query';
import { ConnectUserSwagger } from './swagger/connect-user.swagger.decorator';
import { GetPairGameByIdSwagger } from './swagger/get-pair-game-by-id.swagger.decorator';
import { GetMyCurrentPairGameSwagger } from './swagger/get-my-current-pair-game.swagger.decorator';
import { PairGameService } from '../app/pair-game.service';
import { PairViewDto } from './view-dto/game-pair.view-dto';
import { GetActiveGameByUserIdQuery } from '../app/queries/get-game-by-userid.query';

@ApiTags('Pairs')
@ApiBasicAuth()
@UseGuards(JwtAuthGuard)
@Controller(PATHS.PAIR_GAME_QUIZ)
export class GamePairsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly pairGameService: PairGameService,
  ) {}

  @Get('my-current')
  @GetMyCurrentPairGameSwagger()
  @HttpCode(HttpStatus.OK)
  async getMyCurrentPairGame(
    @CurrentUserId() userId: string,
  ): Promise<PairViewDto> {
    return this.queryBus.execute(new GetActiveGameByUserIdQuery(userId));
  }

  @Get(':id')
  @GetPairGameByIdSwagger()
  @HttpCode(HttpStatus.OK)
  async getPairGameById(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<PairViewDto> {
    const pairGame = await this.queryBus.execute(new GetGameByIdQuery(id));
    await this.pairGameService.userIsParticipatingInTheGame(userId, pairGame);

    return pairGame;
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  @ConnectUserSwagger()
  async connectUser(@CurrentUserId() userId: string): Promise<PairViewDto> {
    const { pairGameId } = await this.commandBus.execute(
      new ConnectUserCommand({ userId }),
    );

    return this.queryBus.execute(new GetGameByIdQuery(pairGameId));
  }
}
