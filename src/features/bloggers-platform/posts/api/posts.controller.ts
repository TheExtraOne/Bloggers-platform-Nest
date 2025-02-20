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
import { LikeStatus } from '../../likes/domain/like.entity';
import { LikesRepository } from '../../likes/infrastructure/likes.repository';
import { JwtOptionalAuthGuard } from 'src/features/user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from 'src/features/user-accounts/guards/decorators/current-optional-user-id.decorator';
import { UpdateLikeStatusInputDto } from '../../likes/api/input-dto/update-like-input.dto';
import { UpdateLikeStatusCommand } from '../../likes/app/likes.use-cases/update-like-status.use-case';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly likesRepository: LikesRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  // TODO: refactor
  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    const mappedPaginatedPosts = await this.postsQueryRepository.findAll(query);
    // If theres no jwt - returning default (NONE) status
    if (!userId) return mappedPaginatedPosts;

    // Getting user's likes
    const userLikes = await this.likesRepository.findAllLikesByAuthorId(userId);
    // Add user's like status to each post
    return {
      ...mappedPaginatedPosts,
      items: mappedPaginatedPosts.items.map((post) => {
        const like = userLikes?.find((like) => like.parentId === post.id);
        return {
          ...post,
          likesInfo: {
            ...post.extendedLikesInfo,
            myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
          },
        };
      }),
    };
  }

  // TODO: refactor
  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostById(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PostsViewDto> {
    const post = await this.postsQueryRepository.findPostById(id);
    // If theres no jwt - returning default (NONE) status
    if (!userId) return post;

    const like = await this.likesRepository.findLikeByAuthorIdAndParentId(
      userId,
      id,
    );
    return {
      ...post,
      extendedLikesInfo: {
        ...post.extendedLikesInfo,
        myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
      },
    };
  }

  // TODO: refactor
  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getAllCommentsForPostId(
    @Param('id') id: string,
    @CurrentOptionalUserId() userId: string | null,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const post = await this.postsQueryRepository.findPostById(id);

    const mappedPaginatedComments =
      await this.commentsQueryRepository.findAllCommentsForPostId(
        post.id,
        query,
      );
    // If theres no jwt - returning default (NONE) status
    if (!userId) return mappedPaginatedComments;

    // Get all user's likes
    const userLikes = await this.likesRepository.findAllLikesByAuthorId(userId);
    // Add user's like status to each comment
    return {
      ...mappedPaginatedComments,
      items: mappedPaginatedComments.items.map((comment) => {
        const like = userLikes?.find((like) => like.parentId === comment.id);
        return {
          ...comment,
          likesInfo: {
            ...comment.likesInfo,
            myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
          },
        };
      }),
    };
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostsViewDto> {
    const postId = await this.commandBus.execute(new CreatePostCommand(dto));

    return await this.postsQueryRepository.findPostById(postId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
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
  async updateLikeStatus(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() updateLikeStatusDto: UpdateLikeStatusInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdateLikeStatusCommand(id, userId, updateLikeStatusDto, 'post'),
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeletePostCommand(id));
  }
}
