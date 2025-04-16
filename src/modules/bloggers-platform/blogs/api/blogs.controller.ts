import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PgBlogsViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs.query-params.input-dto';
import { PATHS } from '../../../../constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { GetAllBlogsSwagger, GetBlogByIdSwagger } from './swagger';
import { PgPostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetBlogByIdQuery } from '../app/queries/get-blog-by-id.query';
import { GetAllPostsByBlogIdQuery } from '../app/queries/get-all-posts-by-blog-id.query';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
import { EntityType } from '../../likes/domain/enums/entity-type.enum';
import { GetAllBlogsQuery } from '../app/queries/get-all-blogs.query';
import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';

@Controller(PATHS.BLOGS)
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @GetAllBlogsSwagger()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
    return await this.queryBus.execute(new GetAllBlogsQuery(query));
  }

  @Get(':id')
  @GetBlogByIdSwagger()
  async getBlogById(@Param('id') id: string): Promise<PgBlogsViewDto> {
    return await this.queryBus.execute(new GetBlogByIdQuery(id));
  }

  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPostsByBlogId(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    @CurrentOptionalUserId() userId: string | null,
  ): Promise<PaginatedViewDto<PgPostsViewDto[]>> {
    const posts = await this.queryBus.execute(
      new GetAllPostsByBlogIdQuery(id, query),
    );

    // Enrich posts with user's like status
    return this.commandBus.execute(
      new EnrichEntitiesWithLikesCommand(posts, userId, EntityType.Post),
    );
  }
}
