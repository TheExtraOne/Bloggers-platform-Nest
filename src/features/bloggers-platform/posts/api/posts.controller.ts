import {
  Body,
  Controller,
  Delete,
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
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { BasicAuthGuard } from 'src/features/user-accounts/guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/features/user-accounts/guards/jwt/jwt-auth.guard';
import { CreateCommentInputDto } from '../../comments/api/input-dto/comment.input.dto';
import { CurrentUserId } from 'src/features/user-accounts/guards/decorators/current-user-id.decorator';
import { CreateCommentCommand } from '../../comments/app/command.use-cases/create-comment.use-case';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { CommentsViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments.query-params.input-dto';
import { CreatePostCommand } from '../app/posts.use-cases/create-post.use-case';
import { DeletePostCommand } from '../app/posts.use-cases/delete-post.use-case';
import { UpdatePostCommand } from '../app/posts.use-cases/update-post.use-case';
import { JwtOptionalAuthGuard } from 'src/features/user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from 'src/features/user-accounts/guards/decorators/current-optional-user-id.decorator';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import {
  EntityType,
  UpdateLikeStatusCommand,
} from '../../likes/app/likes.use-cases/update-like-status.use-case';
import { EnrichPostsWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-posts-with-likes.use-case';
import { EnrichPostWithLikeCommand } from '../../likes/app/likes.use-cases/enrich-post-with-like.use-case';
import { EnrichCommentsWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-comments-with-likes.use-case';
import {
  GetAllPostsSwagger,
  GetPostByIdSwagger,
  GetPostCommentsSwagger,
  CreatePostSwagger,
  CreatePostCommentSwagger,
  UpdatePostSwagger,
  UpdatePostLikeStatusSwagger,
  DeletePostSwagger,
} from './swagger';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @GetAllPostsSwagger()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    // Get all posts
    const posts = await this.postsQueryRepository.findAll(query);

    // Enrich posts with user's like status
    return this.commandBus.execute(
      new EnrichPostsWithLikesCommand(posts, userId),
    );
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostByIdSwagger()
  async getPostById(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PostsViewDto> {
    // Get post by id
    const post = await this.postsQueryRepository.findPostById(id);

    // Enrich post with user's like status
    return this.commandBus.execute(new EnrichPostWithLikeCommand(post, userId));
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @GetPostCommentsSwagger()
  async getAllCommentsForPostId(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    // Check if post exists
    const post = await this.postsQueryRepository.findPostById(id);

    // Get comments for the post
    const comments =
      await this.commentsQueryRepository.findAllCommentsForPostId(
        post.id,
        query,
      );

    // Enrich comments with user's like status
    return this.commandBus.execute(
      new EnrichCommentsWithLikesCommand(comments, userId),
    );
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreatePostSwagger()
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostsViewDto> {
    const postId = await this.commandBus.execute(new CreatePostCommand(dto));

    return await this.postsQueryRepository.findPostById(postId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreatePostCommentSwagger()
  async createCommentByPostId(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() commentDto: CreateCommentInputDto,
  ): Promise<CommentsViewDto> {
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(id, userId, commentDto),
    );

    return await this.commentsQueryRepository.findCommentById(commentId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdatePostSwagger()
  async updatePostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdatePostCommand(id, updatePostDto),
    );
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

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePostSwagger()
  async deletePostById(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeletePostCommand(id));
  }
}
