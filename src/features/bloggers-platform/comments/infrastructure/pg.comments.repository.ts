import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';

@Injectable()
export class PgCommentsRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createComment(
    postId: string,
    userId: string,
    content: string,
  ): Promise<{ commentId: string }> {
    const query = `
    WITH inserted_comment AS (
      INSERT INTO public.comments (post_id, content, commentator_id)
      VALUES ($1, $2, $3)
      RETURNING id
    ),
      comments_likes_information AS(
        INSERT INTO public.comments_likes_information (comment_id)
        SELECT id
        FROM inserted_comment
      )
    SELECT id FROM inserted_comment;
  `;
    const params = [postId, content, userId];
    const result = await this.dataSource.query(query, params);

    return { commentId: result[0].id };
  }

  async findCommentById(
    commentId: string,
  ): Promise<{ commentId: string; commentatorId: string } | null> {
    if (!this.isCorrectNumber(commentId)) {
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

  async updateComment(
    commentId: string,
    userId: string,
    newContent: string,
  ): Promise<void> {
    if (!this.isCorrectNumber(commentId)) {
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

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!this.isCorrectNumber(commentId)) {
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
