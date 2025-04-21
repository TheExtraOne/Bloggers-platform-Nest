import {
  // Body,
  Controller,
  // Get,
  HttpCode,
  HttpStatus,
  // Param,
  Post,
  // Query,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
// import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
// import { PaginatedViewDto } from 'src/core/dto/base.paginated-view.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { PairViewDto } from './view-dto/game-pair.view-dto';
import { GameStatus } from '../domain/pair-game.entity';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';

@ApiTags('Pairs')
@ApiBasicAuth()
@UseGuards(JwtAuthGuard)
@Controller(PATHS.PAIR_GAME_QUIZ)
export class GamePairsController {
  constructor() {} // private readonly queryBus: QueryBus, // private readonly commandBus: CommandBus,

  // TODO: add 2 get endpoints
  // TODO: add swagger
  // @Get()
  // @HttpCode(HttpStatus.OK)
  // @GetAllQuestionsSwagger()
  // async getAllQuestions(
  //   @Query() query: GetQuestionsQueryParams,
  // ): Promise<PaginatedViewDto<PGQuestionViewDto[]>> {
  //   return await this.queryBus.execute(new GetAllQuestionsQuery(query));
  // }

  // TODO: add swagger
  @Post('/connection')
  @HttpCode(HttpStatus.OK)
  async createQuestion(@CurrentUserId() userId: string): Promise<PairViewDto> {
    console.log('userId', userId);
    // Check 	if current user is already participating in active pair (403)
    // Check if there is open pair - connect to it and  select 5 questions
    // Create new pair

    return {
      id: 'string',
      firstPlayerProgress: {
        answers: null,
        player: {
          id: 'string',
          login: 'string',
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: GameStatus.PendingSecondPlayer,
      pairCreatedDate: new Date(),
      startGameDate: null,
      finishGameDate: null,
    };
  }
}
