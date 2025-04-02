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
import { PgPostsQueryRepository } from '../infrastructure/query/pg.posts.query-repository';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt/jwt-auth.guard';
import { CurrentUserId } from '../../../user-accounts/guards/decorators/current-user-id.decorator';
import { CreateCommentInputDto } from '../../comments/api/input-dto/comment.input.dto';
import { PgCommentsViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CreateCommentCommand } from '../../comments/app/command.use-cases/create-comment.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { PgCommentsQueryRepository } from '../../comments/infrastructure/query/pg.comments.query-repository';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
// import { CurrentOptionalUserId } from 'src/modules/user-accounts/guards/decorators/current-optional-user-id.decorator';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments.query-params.input-dto';
// import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { UpdateLikeStatusCommand } from '../../likes/app/likes.use-cases/update-like-status.use-case';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import { EntityType } from '../../likes/domain/enums/entity-type.enum';
// import { EnrichEntityWithLikeCommand } from '../../likes/app/likes.use-cases/enrich-entity-with-like.use-case';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly pgCommentsQueryRepository: PgCommentsQueryRepository,
  ) {}
  // TODO
  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @GetAllPostsSwagger()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const posts = await this.pgPostsQueryRepository.findAllPosts(query);

    // Enrich post with user's like status
    // return this.commandBus.execute(
    //   new EnrichEntitiesWithLikesCommand(posts, userId, EntityType.Post),
    // );
    return posts;
  }
  // TODO
  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostByIdSwagger()
  async getPostById(
    @Param('id') id: string,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PgPostsViewDto | null> {
    const post = await this.pgPostsQueryRepository.findPostById(id);

    // Enrich post with user's like status
    // return this.commandBus.execute(
    //   new EnrichEntityWithLikeCommand(post, userId, EntityType.Post),
    // );
    return post;
  }
  // TODO
  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostCommentsSwagger()
  async getAllCommentsForPostId(
    @Param('id') id: string,
    // @CurrentOptionalUserId() userId: string | null,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<PgCommentsViewDto[]>> {
    const comments =
      await this.pgCommentsQueryRepository.findAllCommentsForPostId(id, query);

    // Enrich comments with user's like status
    // return this.commandBus.execute(
    //   new EnrichEntitiesWithLikesCommand(comments, userId, EntityType.Comment),
    // );
    return comments;
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
    return await this.pgCommentsQueryRepository.findCommentById(commentId);
  }
  // TODO
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
