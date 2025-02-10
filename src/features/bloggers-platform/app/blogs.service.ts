import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../api/input-dto/blogs.input-dto';
import { BlogsViewDto } from '../api/view-dto/blogs.view-dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async getBlogById(id: string): Promise<BlogsViewDto> {
    const blog: BlogDocument = await this.blogsRepository.findBlogById(id);

    return BlogsViewDto.mapToView(blog);
  }

  async createBlog(dto: CreateBlogInputDto): Promise<string> {
    const newBlog = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
    await this.blogsRepository.save(newBlog);

    return newBlog._id.toString();
  }

  async updateBlogById(id: string, dto: UpdateBlogInputDto): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(id);
    blog.update({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogsRepository.save(blog);
  }

  async deleteBlogById(id: string): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(id);
    blog.makeDeleted();

    await this.blogsRepository.save(blog);
  }
}
