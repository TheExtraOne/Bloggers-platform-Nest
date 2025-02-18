import { Injectable } from '@nestjs/common';
import { UpdatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { GetBlogUseCase } from '../blogs.use-cases/get-blog.use-case';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly getBlogUseCase: GetBlogUseCase,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(id: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    const blog = await this.getBlogUseCase.execute(dto.blogId);

    post.update({
      blogId: dto.blogId,
      blogName: blog.name,
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
    });

    await this.postsRepository.save(post);
  }
}
