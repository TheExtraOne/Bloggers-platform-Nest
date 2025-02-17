import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

@Injectable()
export class DeleteBlogUseCase {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(id: string): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(id);
    blog.makeDeleted();

    await this.blogsRepository.save(blog);
  }
}
