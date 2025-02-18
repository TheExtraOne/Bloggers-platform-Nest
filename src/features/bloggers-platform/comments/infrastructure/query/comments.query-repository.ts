import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ERRORS } from '../../../../../constants';
import { ObjectId } from 'mongodb';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { CommentsViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments.query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated-view.dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async findCommentById(id: string): Promise<CommentsViewDto> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    const comment = await this.CommentModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!comment) throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    return CommentsViewDto.mapToView(comment);
  }

  async findAllCommentsForPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    // Creating filter
    const filter: FilterQuery<Comment> = {
      deletedAt: null,
      postId,
    };

    // Getting comments
    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map((comment) => CommentsViewDto.mapToView(comment));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
