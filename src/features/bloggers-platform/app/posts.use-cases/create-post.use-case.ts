import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { CreatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { GetBlogUseCase } from '../blogs.use-cases/get-blog.use-case';

@Injectable()
export class CreatePostUseCase {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private readonly getBlogUseCase: GetBlogUseCase,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(dto: CreatePostInputDto): Promise<string> {
    const blog = await this.getBlogUseCase.execute(dto.blogId);
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
}
