import {
  Body,
  Controller,
  Delete,
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
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateQuestionInputDto } from './input-dto/create-question.input-dto';
import { PGQuestionViewDto } from './view-dto/question.view-dto';
import { CreateQuestionCommand } from '../app/use-cases/create-question.use-case';
import { GetQuestionByIdQuery } from '../app/queries/get-question-by-id.query';
import {
  CreateQuestionSwagger,
  DeleteQuestionSwagger,
  GetAllQuestionsSwagger,
} from './swagger';
import { PaginatedViewDto } from 'src/core/dto/base.paginated-view.dto';
import { GetQuestionsQueryParams } from './input-dto/get-questions.query-params.input-dto';
import { GetAllQuestionsQuery } from '../app/queries/get-all-questions.query';
import { DeleteQuestionCommand } from '../app/use-cases/delete-question.use-case';

@ApiTags('Questions')
@ApiBasicAuth()
@UseGuards(BasicAuthGuard)
@Controller(PATHS.SA_QUESTIONS)
export class QuestionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetAllQuestionsSwagger()
  async getAllQuestions(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<PGQuestionViewDto[]>> {
    return await this.queryBus.execute(new GetAllQuestionsQuery(query));
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteQuestionSwagger()
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
  }
}
