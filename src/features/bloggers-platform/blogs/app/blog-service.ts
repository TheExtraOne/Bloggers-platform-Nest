import { BlogDocument } from '../domain/blog.entity';
import { MgBlogsViewDto } from '../api/view-dto/blogs.view-dto';
import { Injectable } from '@nestjs/common';
import { MgBlogsRepository } from '../infrastructure/mg.blogs.repository';

// TODO: delete
@Injectable()
export class BlogsService {
  constructor(private readonly mgBlogsRepository: MgBlogsRepository) {}

  async getBlogById(id: string): Promise<MgBlogsViewDto> {
    const blog: BlogDocument = await this.mgBlogsRepository.findBlogById(id);

    return MgBlogsViewDto.mapToView(blog);
  }
}
