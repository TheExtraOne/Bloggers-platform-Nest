import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { PgPostsViewDto } from './view-dto/posts.view-dto';
import {
  CreatePostCommentSwagger,
  GetAllPostsSwagger,
  GetPostByIdSwagger,
  GetPostCommentsSwagger,
  UpdatePostLikeStatusSwagger,
} from './swagger';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { GetAllPostsQuery } from '../app/queries/get-all-posts.query';
import { GetPostByIdQuery } from '../app/queries/get-post-by-id.query';
import { GetAllCommentsForPostQuery } from '../../comments/app/queries/get-all-comments-for-post.query';
import { GetCommentByIdQuery } from '../../comments/app/queries/get-comment-by-id.query';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { CreateCommentInputDto } from '../../comments/api/input-dto/comment.input.dto';
import { PgCommentsViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CreateCommentCommand } from '../../comments/app/use-cases/create-comment.use-case';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments.query-params.input-dto';
import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { UpdateLikeStatusCommand } from '../../likes/app/likes.use-cases/update-like-status.use-case';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import { EntityType } from '../../likes/domain/enums/entity-type.enum';
import { EnrichEntityWithLikeCommand } from '../../likes/app/likes.use-cases/enrich-entity-with-like.use-case';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @GetAllPostsSwagger()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const posts = await this.queryBus.execute(new GetAllPostsQuery(query));

    // Enrich post with user's like status
    return this.commandBus.execute(
      new EnrichEntitiesWithLikesCommand(posts, userId, EntityType.Post),
    );
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostByIdSwagger()
  async getPostById(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PgPostsViewDto | null> {
    const post = await this.queryBus.execute(new GetPostByIdQuery(id));

    // Enrich post with user's like status
    return this.commandBus.execute(
      new EnrichEntityWithLikeCommand(post, userId, EntityType.Post),
    );
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostCommentsSwagger()
  async getAllCommentsForPostId(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<PgCommentsViewDto[]>> {
    const comments = await this.queryBus.execute(
      new GetAllCommentsForPostQuery(id, query),
    );

    // Enrich comments with user's like status
    return this.commandBus.execute(
      new EnrichEntitiesWithLikesCommand(comments, userId, EntityType.Comment),
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreatePostCommentSwagger()
  async createCommentByPostId(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() commentDto: CreateCommentInputDto,
  ): Promise<PgCommentsViewDto> {
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(id, userId, commentDto),
    );
    return await this.queryBus.execute(new GetCommentByIdQuery(commentId));
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdatePostLikeStatusSwagger()
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
        EntityType.Post,
      ),
    );
  }
}
