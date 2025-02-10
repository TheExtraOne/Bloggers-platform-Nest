import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../api/input-dto/posts.input-dto';
import { BlogsService } from './blogs.service';
import { PostsRepository } from '../infrastructure/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private readonly blogsService: BlogsService,
    private readonly postsRepository: PostsRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<string> {
    const blog = await this.blogsService.getBlogById(dto.blogId);
    const blogName = blog.name;

    const newPost = this.PostModel.createInstance({
      blogId: dto.blogId,
      blogName: blogName,
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
    });

    await this.postsRepository.save(newPost);

    return newPost._id.toString();
  }

  async updatePostById(id: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    const blog = await this.blogsService.getBlogById(dto.blogId);

    post.update({
      blogId: dto.blogId,
      blogName: blog.name,
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
    });

    await this.postsRepository.save(post);
  }

  async deletePostById(id: string): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    post.makeDeleted();

    await this.postsRepository.save(post);
  }
}
