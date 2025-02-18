import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { CommentsViewDto } from './view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { UpdateCommentInputDto } from './input-dto/comment.input.dto';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { UpdateCommentCommand } from '../app/command.use-cases/update-comment.use-case';
import { DeleteCommentCommand } from '../app/command.use-cases/delete-comment.use-case';

@Controller(PATHS.COMMENTS)
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  async getCommentById(@Param('id') id: string): Promise<CommentsViewDto> {
    return await this.commentsQueryRepository.findCommentById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCommentById(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() updateCommentDto: UpdateCommentInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdateCommentCommand(id, userId, updateCommentDto),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCommentById(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return await this.commandBus.execute(new DeleteCommentCommand(id, userId));
  }
}
