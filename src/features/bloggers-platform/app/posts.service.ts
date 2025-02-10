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
    // TODO do not forget to update blog name after blogId was changed
    // const blog = await this.blogsRepository.findBlogById(id);
    // blog.update({
    //   name: dto.name,
    //   description: dto.description,
    //   websiteUrl: dto.websiteUrl,
    // });
    // await this.blogsRepository.save(blog);
  }

  // async deleteBlogById(id: string): Promise<void> {
  //   const blog = await this.blogsRepository.findBlogById(id);
  //   blog.makeDeleted();

  //   await this.blogsRepository.save(blog);
  // }
}
