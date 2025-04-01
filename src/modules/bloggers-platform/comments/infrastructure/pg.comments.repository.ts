import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';
import { Comments } from '../domain/entities/comment.entity';
import { Posts } from '../../posts/domain/entities/post.entity';
import { Users } from '../../../user-accounts/users/domain/entities/user.entity';

@Injectable()
export class PgCommentsRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Comments)
    private readonly commentsRepository: Repository<Comments>,
  ) {
    super();
  }

  async createComment(
    post: Posts,
    user: Users,
    content: string,
  ): Promise<{ commentId: string }> {
    const newComment = new Comments();
    newComment.post = post;
    newComment.content = content;
    newComment.user = user;

    await this.commentsRepository.save(newComment);

    return { commentId: newComment.id.toString() };
  }

  async findCommentByIdOrThrow(commentId: string): Promise<Comments> {
    if (!this.isCorrectUuid(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const comment = await this.commentsRepository.findOne({
      where: {
        id: commentId,
      },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    return comment;
  }

  async checkCommentExists(commentId: string): Promise<boolean> {
    if (!this.isCorrectUuid(commentId)) {
      return false;
    }
    return this.commentsRepository.exists({
      where: {
        id: commentId,
      },
    });
  }

  async updateComment(commentId: string, newContent: string): Promise<void> {
    const comment = await this.findCommentByIdOrThrow(commentId);
    comment.content = newContent;
    await this.commentsRepository.save(comment);
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.isCorrectUuid(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const result = await this.commentsRepository.softDelete(commentId);

    // `result[affected]` contains the number of affected rows.
    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }
  }
}
