import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';

@Injectable()
export class UpdateBlogUseCase {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(id: string, dto: UpdateBlogInputDto): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(id);
    blog.update({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogsRepository.save(blog);
  }
}
