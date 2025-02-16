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
import { BlogsService } from '../app/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { BlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { CreatePostFromBlogInputDto } from './input-dto/posts.input-dto';
import { PostsService } from '../app/posts.service';
import { PaginatedViewDto } from '../../../core/dto/base.paginated-view.dto';
import { BasicAuthGuard } from 'src/features/user-accounts/guards/basic/basic-auth.guard';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogsViewDto[]>> {
    return await this.blogsQueryRepository.findAll(query);
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogsViewDto> {
    return this.blogsQueryRepository.findBlogById(id);
  }

  @Get(':id/posts')
  async getPostsByBlogId(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    await this.blogsQueryRepository.findBlogById(id);
    return this.postsQueryRepository.findAllPostsForBlogId(id, query);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() createBlogDto: CreateBlogInputDto,
  ): Promise<BlogsViewDto> {
    const blogId = await this.blogsService.createBlog(createBlogDto);
    return this.blogsQueryRepository.findBlogById(blogId);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostByBlogId(
    @Param('id') id: string,
    @Body() postDto: CreatePostFromBlogInputDto,
  ): Promise<PostsViewDto> {
    await this.blogsQueryRepository.findBlogById(id);
    const postId = await this.postsService.createPost({
      ...postDto,
      blogId: id,
    });
    return this.postsQueryRepository.findPostById(postId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogInputDto,
  ) {
    return this.blogsService.updateBlogById(id, updateBlogDto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(@Param('id') id: string) {
    return this.blogsService.deleteBlogById(id);
  }
}
