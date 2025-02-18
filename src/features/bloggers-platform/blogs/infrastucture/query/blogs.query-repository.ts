import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogsViewDto } from '../../api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { FilterQuery } from 'mongoose';
import { ERRORS } from '../../../../../constants';
import { ObjectId } from 'mongodb';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs.query-params.input-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async findBlogById(id: string): Promise<BlogsViewDto> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    const blog = await this.BlogModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!blog) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return BlogsViewDto.mapToView(blog);
  }

  async findAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogsViewDto[]>> {
    // Creating filter
    const filter: FilterQuery<Blog> = {
      deletedAt: null,
    };
    if (query.searchNameTerm)
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };

    // Getting blogs
    const blogs = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = blogs.map((blog) => BlogsViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
