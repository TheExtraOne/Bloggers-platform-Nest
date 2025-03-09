import { Controller, Get, Param, Query } from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { PgPostsViewDto } from './view-dto/posts.view-dto';
import { GetAllPostsSwagger, GetPostByIdSwagger } from './swagger';
import { PgPostsQueryRepository } from '../infrastructure/query/pg.posts.query-repository';

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
  ) {}

  @Get()
  // @UseGuards(JwtOptionalAuthGuard)
  @GetAllPostsSwagger()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    // For MongoDb
    // Get all posts
    // const posts = await this.postsQueryRepository.findAll(query);
    // Enrich posts with user's like status
    // return this.commandBus.execute(
    //   new EnrichPostsWithLikesCommand(posts, userId),
    // );
    // For Postgres
    return await this.pgPostsQueryRepository.findAllPosts(query);
  }

  @Get(':id')
  // @UseGuards(JwtOptionalAuthGuard)
  @GetPostByIdSwagger()
  async getPostById(
    @Param('id') id: string,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PgPostsViewDto | null> {
    // For Mongo
    // Get post by id
    // const post = await this.postsQueryRepository.findPostById(id);
    // Enrich post with user's like status
    // return this.commandBus.execute(new EnrichPostWithLikeCommand(post, userId));

    // For Postgres
    return await this.pgPostsQueryRepository.findPostById(id);
  }

  // @Get(':id/comments')
  // @UseGuards(JwtOptionalAuthGuard)
  // @GetPostCommentsSwagger()
  // async getAllCommentsForPostId(
  //   @Param('id') id: string,
  //   @CurrentOptionalUserId() userId: string | null,
  //   @Query() query: GetCommentsQueryParams,
  // ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
  //   // Check if post exists
  //   const post = await this.postsQueryRepository.findPostById(id);

  //   // Get comments for the post
  //   const comments =
  //     await this.commentsQueryRepository.findAllCommentsForPostId(
  //       post.id,
  //       query,
  //     );

  //   // Enrich comments with user's like status
  //   return this.commandBus.execute(
  //     new EnrichCommentsWithLikesCommand(comments, userId),
  //   );
  // }

  // @Post(':id/comments')
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.CREATED)
  // @CreatePostCommentSwagger()
  // async createCommentByPostId(
  //   @CurrentUserId() userId: string,
  //   @Param('id') id: string,
  //   @Body() commentDto: CreateCommentInputDto,
  // ): Promise<CommentsViewDto> {
  //   const commentId = await this.commandBus.execute(
  //     new CreateCommentCommand(id, userId, commentDto),
  //   );

  //   return await this.commentsQueryRepository.findCommentById(commentId);
  // }

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
