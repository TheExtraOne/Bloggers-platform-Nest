import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateQuestionInputDto } from './input-dto/create-question.input-dto';
import { PGQuestionViewDto } from './view-dto/question.view-dto';
import { CreateQuestionCommand } from '../app/use-cases/create-question.use-case';
import { GetQuestionByIdQuery } from '../app/queries/get-question-by-id.query';
import { CreateQuestionSwagger } from './swagger';

@ApiTags('Questions')
@ApiBasicAuth()
@UseGuards(BasicAuthGuard)
@Controller(PATHS.SA_QUESTIONS)
export class QuestionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // @Get()
  // @HttpCode(HttpStatus.OK)
  // @GetAllUsersSwagger()
  // async getAllUsers(
  //   @Query() query: GetUsersQueryParams,
  // ): Promise<PaginatedViewDto<PGUserViewDto[]>> {
  //   return await this.queryBus.execute(new GetAllUsersQuery(query));
  // }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateQuestionSwagger()
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionInputDto,
  ): Promise<PGQuestionViewDto> {
    const { questionId } = await this.commandBus.execute(
      new CreateQuestionCommand(createQuestionDto),
    );

    return await this.queryBus.execute(new GetQuestionByIdQuery(questionId));
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @DeleteUserSwagger()
  // async deleteUser(@Param('id') id: string): Promise<void> {
  //   await this.commandBus.execute(new DeleteUserCommand(id));
  // }
}
