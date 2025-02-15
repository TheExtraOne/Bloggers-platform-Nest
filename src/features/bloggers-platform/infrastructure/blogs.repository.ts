import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { ObjectId } from 'mongodb';
import { ERRORS } from '../../../constants';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async save(blog: BlogDocument): Promise<void> {
    await blog.save();
  }

  async findBlogById(id: string): Promise<BlogDocument> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    const blog = await this.BlogModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return blog;
  }
}
