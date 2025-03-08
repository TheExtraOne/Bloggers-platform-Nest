import { Controller, Get, Param, Query } from '@nestjs/common';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetAllBlogsSwagger, GetBlogByIdSwagger } from './swagger';
import { PgBlogsQueryRepository } from '../infrastructure/query/pg.blogs.query-repository';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly pgBlogsQueryRepository: PgBlogsQueryRepository,
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
    return this.pgBlogsQueryRepository.getBlogById(id);
  }
}
