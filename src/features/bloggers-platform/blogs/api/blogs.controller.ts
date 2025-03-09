import { Controller, Get, Param, Query } from '@nestjs/common';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetAllBlogsSwagger, GetBlogByIdSwagger } from './swagger';
import { PgBlogsQueryRepository } from '../infrastructure/query/pg.blogs.query-repository';
import { PgPostsQueryRepository } from '../../posts/infrastructure/query/pg.posts.query-repository';
import { PgPostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';

// TODO: update swagger
@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly pgBlogsQueryRepository: PgBlogsQueryRepository,
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
  ) {}

  @Get()
  @GetAllBlogsSwagger()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    // For Postgres
    return await this.pgBlogsQueryRepository.findAll(query);
  }

  @Get(':id')
  @GetBlogByIdSwagger()
  async getBlogById(@Param('id') id: string): Promise<PgBlogsViewDto> {
    // For Postgres
    return await this.pgBlogsQueryRepository.getBlogById(id);
  }

  @Get(':id/posts')
  async getAllPostsByBlogId(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    // For Postgres
    return await this.pgPostsQueryRepository.findAllPostsForBlogId(id, query);
  }
}
