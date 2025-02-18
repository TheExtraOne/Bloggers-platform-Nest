import { BlogDocument } from '../domain/blog.entity';
import { BlogsViewDto } from '../api/view-dto/blogs.view-dto';
import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async getBlogById(id: string): Promise<BlogsViewDto> {
    const blog: BlogDocument = await this.blogsRepository.findBlogById(id);

    return BlogsViewDto.mapToView(blog);
  }
}
