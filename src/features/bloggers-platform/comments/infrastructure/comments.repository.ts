import { Injectable } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { ObjectId } from 'mongodb';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../constants';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }

  async findCommentById(id: string): Promise<CommentDocument> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    const comment = await this.CommentModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!comment) throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    return comment;
  }
}
