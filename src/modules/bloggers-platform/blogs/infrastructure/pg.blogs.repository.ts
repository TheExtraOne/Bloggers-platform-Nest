import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERRORS } from '../../../../constants';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { Blogs } from '../domain/entities/blog.entity';

@Injectable()
export class PgBlogsRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Blogs)
    private readonly blogsRepository: Repository<Blogs>,
  ) {
    super();
  }

  async findBlogByIdOrThrow(id: string): Promise<Blogs> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const blog = await this.blogsRepository.findOneBy({
      id: +id,
    });
    if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return blog;
  }

  async createBlog(dto: {
    name: string;
    description: string;
    websiteUrl: string;
  }): Promise<{ blogId: string }> {
    const { name, description, websiteUrl } = dto;

    const newBlog = new Blogs();
    newBlog.name = name;
    newBlog.description = description;
    newBlog.websiteUrl = websiteUrl;
    await this.blogsRepository.save(newBlog);

    return { blogId: newBlog.id.toString() };
  }

  async checkBlogExists(id: string): Promise<boolean> {
    if (!this.isCorrectNumber(id)) {
      return false;
    }
    const exists = await this.blogsRepository.exists({
      where: {
        id: +id,
      },
    });

    return exists;
  }

  async updateBlog(
    id: string,
    dto: {
      name: string;
      description: string;
      websiteUrl: string;
    },
  ): Promise<void> {
    const { name, description, websiteUrl } = dto;

    const blog = await this.findBlogByIdOrThrow(id);

    blog.name = name;
    blog.description = description;
    blog.websiteUrl = websiteUrl;

    await this.blogsRepository.save(blog);
  }

  async deleteBlog(id: string): Promise<void> {
    const blog = await this.findBlogByIdOrThrow(id);

    await this.blogsRepository.softDelete(blog.id);
  }
}
