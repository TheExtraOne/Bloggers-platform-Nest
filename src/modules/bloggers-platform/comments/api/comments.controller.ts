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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PgCommentsViewDto } from './view-dto/comment.view-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { UpdateCommentInputDto } from './input-dto/comment.input.dto';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { UpdateCommentCommand } from '../app/use-cases/update-comment.use-case';
import { DeleteCommentCommand } from '../app/use-cases/delete-comment.use-case';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import { UpdateLikeStatusCommand } from '../../likes/app/likes.use-cases/update-like-status.use-case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
import {
  GetCommentByIdSwagger,
  UpdateCommentSwagger,
  UpdateCommentLikeStatusSwagger,
  DeleteCommentSwagger,
} from './swagger';
import { GetCommentByIdQuery } from '../app/queries/get-comment-by-id.query';
import { EntityType } from '../../likes/domain/enums/entity-type.enum';
import { EnrichEntityWithLikeCommand } from '../../likes/app/likes.use-cases/enrich-entity-with-like.use-case';

@Controller(PATHS.COMMENTS)
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @GetCommentByIdSwagger()
  async getCommentById(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PgCommentsViewDto> {
    const comment: PgCommentsViewDto = await this.queryBus.execute(
      new GetCommentByIdQuery(id),
    );

    // Enrich comment with user's like status
    return this.commandBus.execute(
      new EnrichEntityWithLikeCommand(comment, userId, EntityType.Comment),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdateCommentSwagger()
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
  @UpdateCommentLikeStatusSwagger()
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
  @DeleteCommentSwagger()
  async deleteCommentById(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return await this.commandBus.execute(new DeleteCommentCommand(id, userId));
  }
}
