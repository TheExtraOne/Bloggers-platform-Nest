import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';
import { Comments } from '../domain/entities/comment.entity';
import { Posts } from '../../posts/domain/entities/post.entity';
import { Users } from '../../../user-accounts/users/domain/entities/user.entity';

@Injectable()
export class PgCommentsRepository extends PgBaseRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
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
  // TODO
  async findCommentById(
    commentId: string,
  ): Promise<{ commentId: string; commentatorId: string } | null> {
    if (!this.isCorrectUuid(commentId)) {
      return null;
    }

    const query = `
      SELECT *
      FROM public.comments
      WHERE comments.id = $1
      AND comments.deleted_at IS NULL
    `;
    const params = [commentId];
    const result = await this.dataSource.query(query, params);

    return result[0]
      ? { commentId: result[0].id, commentatorId: result[0].commentator_id }
      : null;
  }
  // TODO
  async updateComment(
    commentId: string,
    userId: string,
    newContent: string,
  ): Promise<void> {
    if (!this.isCorrectUuid(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const query = `
      UPDATE public.comments
      SET content = $1, updated_at = NOW()
      WHERE comments.id = $2
      AND comments.deleted_at IS NULL
      AND comments.commentator_id = $3
    `;
    const params = [newContent, commentId, userId];
    await this.dataSource.query(query, params);
  }
  // TODO
  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!this.isCorrectUuid(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const query = `
      UPDATE public.comments
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE comments.id = $1
      AND comments.deleted_at IS NULL
      AND comments.commentator_id = $2
    `;
    const params = [commentId, userId];
    await this.dataSource.query(query, params);
  }
}
