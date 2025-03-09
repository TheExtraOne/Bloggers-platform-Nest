import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { MgPostsViewDto } from '../../api/view-dto/posts.view-dto';
import { FilterQuery } from 'mongoose';
import { ERRORS } from '../../../../../constants';
import { ObjectId } from 'mongodb';

@Injectable()
export class MgPostsQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async findPostById(id: string): Promise<MgPostsViewDto> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    const post = await this.PostModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    return MgPostsViewDto.mapToView(post);
  }

  async findAll(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<MgPostsViewDto[]>> {
    // Creating filter
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    // Getting posts
    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => MgPostsViewDto.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async findAllPostsForBlogId(
    blogId: string,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<MgPostsViewDto[]>> {
    // Creating filter
    const filter: FilterQuery<Post> = {
      deletedAt: null,
      blogId,
    };

    // Getting posts
    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => MgPostsViewDto.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
