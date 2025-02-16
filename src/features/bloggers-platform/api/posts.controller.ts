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
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated-view.dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { PostsService } from '../app/posts.service';
import { BasicAuthGuard } from 'src/features/user-accounts/guards/basic/basic-auth.guard';

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
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostsViewDto> {
    const postId = await this.postsService.createPost(dto);

    return await this.postsQueryRepository.findPostById(postId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostInputDto,
  ): Promise<void> {
    return await this.postsService.updatePostById(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(@Param('id') id: string): Promise<void> {
    return await this.postsService.deletePostById(id);
  }
}
