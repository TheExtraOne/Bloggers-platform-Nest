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
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import {
  EntityType,
  UpdateLikeStatusCommand,
} from '../../likes/app/likes.use-cases/update-like-status.use-case';
import { GetUserStatusCommand } from '../../likes/app/likes.use-cases/get-user-status.use-case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';

@Controller(PATHS.COMMENTS)
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  // TODO: refactor
  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentById(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<CommentsViewDto> {
    const mappedComment =
      await this.commentsQueryRepository.findCommentById(id);

    // JWT is optional, if there is no JWT - returning with default (NONE) status
    if (!userId) return mappedComment;

    const myStatus = await this.commandBus.execute(
      new GetUserStatusCommand(userId, id),
    );

    const enrichedComment = {
      ...mappedComment,
      likesInfo: {
        ...mappedComment.likesInfo,
        myStatus,
      },
    };

    return enrichedComment;
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

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() updateLikeStatusDto: UpdateLikeStatusInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdateLikeStatusCommand(
        id,
        userId,
        updateLikeStatusDto,
        EntityType.Comment,
      ),
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
