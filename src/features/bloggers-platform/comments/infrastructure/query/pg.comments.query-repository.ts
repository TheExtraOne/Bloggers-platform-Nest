import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';
import { PgCommentsViewDto } from '../../api/view-dto/comment.view-dto';

export type TPgComment = {
  id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  likes_count: number;
  dislikes_count: number;
  commentator_id: string;
  commentator_login: string;
};

@Injectable()
export class PgCommentsQueryRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async findCommentById(commentId: string): Promise<PgCommentsViewDto | null> {
    const query = `
      SELECT comments.*, users.login as commentator_login, likes.likes_count, likes.dislikes_count
      FROM public.comments as comments
      LEFT JOIN public.users as users
      ON comments.commentator_id = users.id
      LEFT JOIN public.comments_likes_information as likes
      ON comments.id = likes.comment_id
      WHERE comments.id = $1
      AND comments.deleted_at IS NULL
    `;
    const params = [commentId];
    const result = await this.dataSource.query(query, params);

    return result[0] ? PgCommentsViewDto.mapToView(result[0]) : null;
  }
}
