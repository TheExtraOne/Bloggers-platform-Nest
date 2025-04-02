import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetAllBlogsSwagger, GetBlogByIdSwagger } from './swagger';
import { PgBlogsQueryRepository } from '../infrastructure/query/pg.blogs.query-repository';
import { PgPostsQueryRepository } from '../../posts/infrastructure/query/pg.posts.query-repository';
import { PgPostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
// import { CommandBus } from '@nestjs/cqrs';
// import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
// import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
// import { EntityType } from '../../likes/app/likes.use-cases/update-like-status.use-case';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    // private readonly commandBus: CommandBus,
    private readonly pgBlogsQueryRepository: PgBlogsQueryRepository,
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
  ) {}

  @Get()
  @GetAllBlogsSwagger()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    return await this.pgBlogsQueryRepository.findAll(query);
  }

  @Get(':id')
  @GetBlogByIdSwagger()
  async getBlogById(@Param('id') id: string): Promise<PgBlogsViewDto> {
    return await this.pgBlogsQueryRepository.getBlogById(id);
  }

  // TODO
  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPostsByBlogId(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    // @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const posts = await this.pgPostsQueryRepository.findAllPostsForBlogId(
      id,
      query,
    );

    // Enrich posts with user's like status
    // return this.commandBus.execute(
    //   new EnrichEntitiesWithLikesCommand(posts, userId, EntityType.Post),
    // );
    return posts;
  }
}
