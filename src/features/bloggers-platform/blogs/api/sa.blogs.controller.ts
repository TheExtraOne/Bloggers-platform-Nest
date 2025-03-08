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
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CreateBlogCommand } from '../app/blogs.use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../app/blogs.use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../app/blogs.use-cases/update-blog.use-case';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import {
  GetAllBlogsSwagger,
  CreateBlogSwagger,
  UpdateBlogSwagger,
  DeleteBlogSwagger,
} from './swagger';
import { PgBlogsQueryRepository } from '../infrastructure/query/pg.blogs.query-repository';

@Controller(PATHS.SA_BLOGS)
export class SaBlogsController {
  constructor(
    private readonly commandBus: CommandBus,
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

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdateBlogSwagger()
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, updateBlogDto));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteBlogSwagger()
  async deleteBlogById(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }
}
