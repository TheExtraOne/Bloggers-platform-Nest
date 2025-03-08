import {
  Body,
  Controller,
  // Delete,
  Get,
  HttpCode,
  HttpStatus,
  // Param,
  Post,
  // Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateBlogInputDto,
  // UpdateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateBlogCommand } from '../app/blogs.use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
// import { DeleteBlogCommand } from '../app/blogs.use-cases/delete-blog.use-case';
// import { UpdateBlogCommand } from '../app/blogs.use-cases/update-blog.use-case';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
// import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
// import { CreatePostFromBlogInputDto } from '../../posts/api/input-dto/posts.input-dto';
// import { PostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
// import { CreatePostCommand } from '../../posts/app/posts.use-cases/create-post.use-case';
// import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
// import { MgBlogsQueryRepository } from '../infrastructure/query/mg.blogs.query-repository';
// import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
// import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
// import { EnrichPostsWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-posts-with-likes.use-case';
import {
  GetAllBlogsSwagger,
  // GetBlogByIdSwagger,
  // GetBlogPostsSwagger,
  CreateBlogSwagger,
  // CreateBlogPostSwagger,
  // UpdateBlogSwagger,
  // DeleteBlogSwagger,
} from './swagger';
import { PgBlogsQueryRepository } from '../infrastructure/query/pg.blogs.query-repository';

@Controller(PATHS.SA_BLOGS)
export class SaBlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    // private readonly mgBlogsQueryRepository: MgBlogsQueryRepository,
    // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly pgBlogsQueryRepository: PgBlogsQueryRepository,
  ) {}

  @Get()
  @GetAllBlogsSwagger()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    // For MongoDb
    // return await this.mgBlogsQueryRepository.findAll(query);

    // For Postgres
    return await this.pgBlogsQueryRepository.findAll(query);
  }

  // @Get(':id')
  // @GetBlogByIdSwagger()
  // async getBlogById(@Param('id') id: string): Promise<MgBlogsViewDto> {
  //   return this.mgBlogsQueryRepository.findBlogById(id);
  // }

  // @Get(':id/posts')
  // @UseGuards(JwtOptionalAuthGuard)
  // @GetBlogPostsSwagger()
  // async getPostsByBlogId(
  //   @Param('id') id: string,
  //   @Query() query: GetPostsQueryParams,
  //   @CurrentOptionalUserId() userId: string | null,
  // ): Promise<PaginatedViewDto<PostsViewDto[]>> {
  //   // Check if blog exists
  //   await this.mgBlogsQueryRepository.findBlogById(id);

  //   // Get posts for the blog
  //   const posts = await this.postsQueryRepository.findAllPostsForBlogId(
  //     id,
  //     query,
  //   );

  //   // Enrich posts with user's like status
  //   return this.commandBus.execute(
  //     new EnrichPostsWithLikesCommand(posts, userId),
  //   );
  // }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreateBlogSwagger()
  async createBlog(
    @Body() createBlogDto: CreateBlogInputDto,
  ): Promise<PgBlogsViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogCommand(createBlogDto),
    );
    // For MongoDb
    // return this.mgBlogsQueryRepository.findBlogById(blogId);

    // For Postgres
    return this.pgBlogsQueryRepository.getBlogById(blogId);
  }

  // @Post(':id/posts')
  // @UseGuards(BasicAuthGuard)
  // @CreateBlogPostSwagger()
  // async createPostByBlogId(
  //   @Param('id') id: string,
  //   @Body() postDto: CreatePostFromBlogInputDto,
  // ): Promise<PostsViewDto> {
  //   // Checking if blog exists
  //   await this.mgBlogsQueryRepository.findBlogById(id);
  //   const postId = await this.commandBus.execute(
  //     new CreatePostCommand({
  //       ...postDto,
  //       blogId: id,
  //     }),
  //   );
  //   return this.postsQueryRepository.findPostById(postId);
  // }

  // @Put(':id')
  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @UpdateBlogSwagger()
  // async updateBlogById(
  //   @Param('id') id: string,
  //   @Body() updateBlogDto: UpdateBlogInputDto,
  // ): Promise<void> {
  //   return this.commandBus.execute(new UpdateBlogCommand(id, updateBlogDto));
  // }

  // @Delete(':id')
  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @DeleteBlogSwagger()
  // async deleteBlogById(@Param('id') id: string): Promise<void> {
  //   return this.commandBus.execute(new DeleteBlogCommand(id));
  // }
}
