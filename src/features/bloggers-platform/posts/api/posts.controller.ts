import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { CurrentOptionalUserId } from 'src/features/user-accounts/guards/decorators/current-optional-user-id.decorator';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments.query-params.input-dto';
import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { EntityType } from '../../likes/app/likes.use-cases/update-like-status.use-case';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly pgCommentsQueryRepository: PgCommentsQueryRepository,
  ) {}

  @Get()
  // @UseGuards(JwtOptionalAuthGuard)
  @GetAllPostsSwagger()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    // return this.commandBus.execute(
    //   new EnrichPostsWithLikesCommand(posts, userId),
    // );

    return await this.pgPostsQueryRepository.findAllPosts(query);
  }

  @Get(':id')
  // @UseGuards(JwtOptionalAuthGuard)
  @GetPostByIdSwagger()
  async getPostById(
    @Param('id') id: string,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PgPostsViewDto | null> {
    // Enrich post with user's like status
    // return this.commandBus.execute(new EnrichPostWithLikeCommand(post, userId));

    return await this.pgPostsQueryRepository.findPostById(id);
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostCommentsSwagger()
  async getAllCommentsForPostId(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<PgCommentsViewDto[]>> {
    const comments =
      await this.pgCommentsQueryRepository.findAllCommentsForPostId(id, query);

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
  ): Promise<PgCommentsViewDto | null> {
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(id, userId, commentDto),
    );
    return await this.pgCommentsQueryRepository.findCommentById(commentId);
  }

  // @Put(':id/like-status')
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @UpdatePostLikeStatusSwagger()
  // async updateLikeStatus(
  //   @Param('id') id: string,
  //   @CurrentUserId() userId: string,
  //   @Body() updateLikeStatusDto: UpdateLikeStatusInputDto,
  // ): Promise<void> {
  //   return await this.commandBus.execute(
  //     new UpdateLikeStatusCommand(
  //       id,
  //       userId,
  //       updateLikeStatusDto,
  //       EntityType.Post,
  //     ),
  //   );
  // }
}
