import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ERRORS } from '../../../../constants';
import { ObjectId } from 'mongodb';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { CommentsViewDto } from '../../api/view-dto/comment.view-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async findCommentById(id: string): Promise<CommentsViewDto> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    const comment = await this.CommentModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!comment) throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);

    return CommentsViewDto.mapToView(comment);
  }

  // async findAll(
  //   query: GetPostsQueryParams,
  // ): Promise<PaginatedViewDto<PostsViewDto[]>> {
  //   // Creating filter
  //   const filter: FilterQuery<Post> = {
  //     deletedAt: null,
  //   };

  //   // Getting posts
  //   const posts = await this.PostModel.find(filter)
  //     .sort({ [query.sortBy]: query.sortDirection })
  //     .skip(query.calculateSkip())
  //     .limit(query.pageSize);

  //   const totalCount = await this.PostModel.countDocuments(filter);

  //   const items = posts.map((post) => PostsViewDto.mapToView(post));

  //   return PaginatedViewDto.mapToView({
  //     items,
  //     totalCount,
  //     page: query.pageNumber,
  //     size: query.pageSize,
  //   });
  // }

  // async findAllPostsForBlogId(
  //   blogId: string,
  //   query: GetPostsQueryParams,
  // ): Promise<PaginatedViewDto<PostsViewDto[]>> {
  //   // Creating filter
  //   const filter: FilterQuery<Post> = {
  //     deletedAt: null,
  //     blogId,
  //   };

  //   // Getting posts
  //   const posts = await this.PostModel.find(filter)
  //     .sort({ [query.sortBy]: query.sortDirection })
  //     .skip(query.calculateSkip())
  //     .limit(query.pageSize);

  //   const totalCount = await this.PostModel.countDocuments(filter);

  //   const items = posts.map((post) => PostsViewDto.mapToView(post));

  //   return PaginatedViewDto.mapToView({
  //     items,
  //     totalCount,
  //     page: query.pageNumber,
  //     size: query.pageSize,
  //   });
  // }
}
