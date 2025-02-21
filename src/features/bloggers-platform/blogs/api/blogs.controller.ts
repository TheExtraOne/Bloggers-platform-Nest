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
import { BlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { BasicAuthGuard } from '../../../../features/user-accounts/guards/basic/basic-auth.guard';
import { CreateBlogCommand } from '../app/blogs.use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../app/blogs.use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../app/blogs.use-cases/update-blog.use-case';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
import { CreatePostFromBlogInputDto } from '../../posts/api/input-dto/posts.input-dto';
import { PostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostCommand } from '../../posts/app/posts.use-cases/create-post.use-case';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
import { EnrichPostsWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-posts-with-likes.use-case';
import {
  GetAllBlogsSwagger,
  GetBlogByIdSwagger,
  GetBlogPostsSwagger,
  CreateBlogSwagger,
  CreateBlogPostSwagger,
  UpdateBlogSwagger,
  DeleteBlogSwagger,
} from './swagger';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  @GetAllBlogsSwagger()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogsViewDto[]>> {
    return await this.blogsQueryRepository.findAll(query);
  }

  @Get(':id')
  @GetBlogByIdSwagger()
  async getBlogById(@Param('id') id: string): Promise<BlogsViewDto> {
    return this.blogsQueryRepository.findBlogById(id);
  }

  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  @GetBlogPostsSwagger()
  async getPostsByBlogId(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    // Check if blog exists
    await this.blogsQueryRepository.findBlogById(id);

    // Get posts for the blog
    const posts = await this.postsQueryRepository.findAllPostsForBlogId(
      id,
      query,
    );

    // Enrich posts with user's like status
    return this.commandBus.execute(
      new EnrichPostsWithLikesCommand(posts, userId),
    );
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @CreateBlogSwagger()
  async createBlog(
    @Body() createBlogDto: CreateBlogInputDto,
  ): Promise<BlogsViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogCommand(createBlogDto),
    );
    return this.blogsQueryRepository.findBlogById(blogId);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  @CreateBlogPostSwagger()
  async createPostByBlogId(
    @Param('id') id: string,
    @Body() postDto: CreatePostFromBlogInputDto,
  ): Promise<PostsViewDto> {
    // Checking if blog exists
    await this.blogsQueryRepository.findBlogById(id);
    const postId = await this.commandBus.execute(
      new CreatePostCommand({
        ...postDto,
        blogId: id,
      }),
    );
    return this.postsQueryRepository.findPostById(postId);
  }

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
