import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateBlogInputDto } from '../../api/input-dto/blogs.input-dto';

@Injectable()
export class CreateBlogUseCase {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(dto: CreateBlogInputDto): Promise<string> {
    const newBlog = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
    await this.blogsRepository.save(newBlog);

    return newBlog._id.toString();
  }
}
