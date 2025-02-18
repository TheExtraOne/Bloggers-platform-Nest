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
import { PATHS } from '../../../constants';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated-view.dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { BasicAuthGuard } from 'src/features/user-accounts/guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../app/posts.use-cases/create-post.use-case';
import { DeletePostCommand } from '../app/posts.use-cases/delete-post.use-case';
import { UpdatePostCommand } from '../app/posts.use-cases/update-post.use-case';
import { JwtAuthGuard } from 'src/features/user-accounts/guards/jwt/jwt-auth.guard';
import { CreateCommentInputDto } from './input-dto/comment.input.dto';
import { CurrentUserId } from 'src/features/user-accounts/guards/decorators/current-user-id.decorator';
import { CreateCommentCommand } from '../app/command.use-cases/create-comment.use-case';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentsViewDto } from './view-dto/comment.view-dto';
import { GetCommentsQueryParams } from './input-dto/get-comments.query-params.input-dto';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    return await this.postsQueryRepository.findAll(query);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<PostsViewDto> {
    return await this.postsQueryRepository.findPostById(id);
  }

  @Get(':id/comments')
  async getAllCommentsForPostId(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const post = await this.postsQueryRepository.findPostById(id);

    return await this.commentsQueryRepository.findAllCommentsForPostId(
      post.id,
      query,
    );
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

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeletePostCommand(id));
  }
}
