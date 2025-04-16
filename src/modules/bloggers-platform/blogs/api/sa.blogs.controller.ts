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
import { CreateBlogCommand } from '../app/use-cases/create-blog.use-case';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../app/use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../app/use-cases/update-blog.use-case';
import { PATHS } from '../../../../constants';
import { GetAllBlogsQuery } from '../app/queries/get-all-blogs.query';
import { GetAllPostsByBlogIdQuery } from '../app/queries/get-all-posts-by-blog-id.query';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import {
  GetAllBlogsSwagger,
  CreateBlogSwagger,
  UpdateBlogSwagger,
  DeleteBlogSwagger,
  CreateBlogPostSwagger,
  GetBlogPostsSwagger,
} from './swagger';
import {
  CreatePostFromBlogInputDto,
  UpdatePostInputDto,
} from '../../posts/api/input-dto/posts.input-dto';
import { PgPostsViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostCommand } from '../../posts/app/use-cases/create-post.use-case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/jwt/jwt-optional-auth.guard';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
import { DeletePostSwagger, UpdatePostSwagger } from '../../posts/api/swagger';
import { UpdatePostCommand } from '../../posts/app/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../posts/app/use-cases/delete-post.use-case';
import { CurrentOptionalUserId } from '../../../user-accounts/guards/decorators/current-optional-user-id.decorator';
import { EnrichEntitiesWithLikesCommand } from '../../likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { EntityType } from '../../likes/domain/enums/entity-type.enum';
import { GetBlogByIdQuery } from '../app/queries/get-blog-by-id.query';
import { GetPostByIdQuery } from '../../posts/app/queries/get-post-by-id.query';

@UseGuards(BasicAuthGuard)
@Controller(PATHS.SA_BLOGS)
export class SaBlogsController {
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

  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  @GetBlogPostsSwagger()
  async getPostsByBlogId(
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateBlogSwagger()
  async createBlog(
    @Body() createBlogDto: CreateBlogInputDto,
  ): Promise<PgBlogsViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogCommand(createBlogDto),
    );
    return this.queryBus.execute(new GetBlogByIdQuery(blogId));
  }

  @Post(':id/posts')
  @CreateBlogPostSwagger()
  async createPostByBlogId(
    @Param('id') id: string,
    @Body() postDto: CreatePostFromBlogInputDto,
  ): Promise<PgPostsViewDto | null> {
    const postId = await this.commandBus.execute(
      new CreatePostCommand({
        ...postDto,
        blogId: id,
      }),
    );

    return this.queryBus.execute(new GetPostByIdQuery(postId));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdateBlogSwagger()
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, updateBlogDto));
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UpdatePostSwagger()
  async updatePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdatePostCommand(blogId, postId, updatePostDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteBlogSwagger()
  async deleteBlogById(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePostSwagger()
  async deletePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return await this.commandBus.execute(new DeletePostCommand(blogId, postId));
  }
}
