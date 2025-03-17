import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from 'src/core/base-classes/pg.base.repository';

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
}
