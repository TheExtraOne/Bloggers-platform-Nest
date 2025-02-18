import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { BlogsViewDto } from '../../api/view-dto/blogs.view-dto';

@Injectable()
export class GetBlogUseCase {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(id: string): Promise<BlogsViewDto> {
    const blog: BlogDocument = await this.blogsRepository.findBlogById(id);

    return BlogsViewDto.mapToView(blog);
  }
}
