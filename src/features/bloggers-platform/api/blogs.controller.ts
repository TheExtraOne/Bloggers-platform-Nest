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
} from '@nestjs/common';
import { PATHS } from 'src/settings';
import { BlogsService } from '../app/blogs.service';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { BlogsViewDto } from './view-dto/blogs.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated-view.dto';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsQueryRepository: BlogsQueryRepository,
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
  async getPostsByBlogId(@Param('id') id: string) {
    return Promise.resolve([]);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() createBlogDto: CreateBlogInputDto,
  ): Promise<BlogsViewDto> {
    const blogId = await this.blogsService.createBlog(createBlogDto);
    return this.blogsQueryRepository.findBlogById(blogId);
  }

  @Post(':id/posts')
  async createPostByBlogId(@Param('id') id: string) {
    return Promise.resolve({});
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogInputDto,
  ) {
    return this.blogsService.updateBlogById(id, updateBlogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(@Param('id') id: string) {
    return this.blogsService.deleteBlogById(id);
  }
}
