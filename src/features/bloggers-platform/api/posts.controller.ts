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
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
// import { PaginatedViewDto } from 'src/features/dto/base.paginated-view.dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { PostsService } from '../app/posts.service';

export abstract class PaginatedViewDto<T> {
  abstract items: T;
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;

  // Static method for mapping
  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      items: data.items,
    };
  }
}

@Controller(PATHS.POSTS)
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
  ) {}

  @Get()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    return await this.postsQueryRepository.findAll(query);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<PostsViewDto> {
    return await this.postsQueryRepository.findPostById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostsViewDto> {
    const postId = await this.postsService.createPost(dto);

    return await this.postsQueryRepository.findPostById(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostInputDto,
  ): Promise<void> {
    return await this.postsService.updatePostById(id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(@Param('id') id: string): Promise<void> {
    return await this.postsService.deletePostById(id);
  }
}
