import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { PairViewDto } from './view-dto/game-pair.view-dto';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { ConnectUserCommand } from '../app/use-cases/connect-user.use-case';
import { GetGameByIdQuery } from '../app/queries/get-game-by-id.query';

@ApiTags('Pairs')
@ApiBasicAuth()
@UseGuards(JwtAuthGuard)
@Controller(PATHS.PAIR_GAME_QUIZ)
export class GamePairsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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
  async connectUser(@CurrentUserId() userId: string): Promise<PairViewDto> {
    const { pairGameId } = await this.commandBus.execute(
      new ConnectUserCommand({ userId }),
    );

    return this.queryBus.execute(new GetGameByIdQuery(pairGameId));
  }
}
