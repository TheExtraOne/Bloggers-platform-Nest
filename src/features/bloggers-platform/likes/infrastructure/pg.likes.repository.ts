import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';
import { LikeStatus } from '../domain/like.entity';
import { EntityType } from '../app/likes.use-cases/update-like-status.use-case';

@Injectable()
export class PgLikesRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createLike(dto: {
    userId: string;
    parentId: string;
    status: LikeStatus;
    parentType: EntityType;
  }): Promise<void> {
    const query = `
      INSERT INTO public.likes (user_id, parent_id, like_status, parent_type)
      VALUES ($1, $2, $3, $4)`;
    const values = [dto.userId, dto.parentId, dto.status, dto.parentType];

    await this.dataSource.query(query, values);
  }

  async findLikeByAuthorIdAndParentId(
    userId: string,
    parentId: string,
    entityType: EntityType,
  ): Promise<{ likeId: string } | null> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectNumber(parentId)) {
      return null;
    }
    const query = `
      SELECT likes.*
      FROM public.likes as likes
      WHERE likes.user_id = $1
      AND likes.parent_id = $2
      AND likes.parent_type = $3
    `;

    const params = [userId, parentId, entityType];
    const result = await this.dataSource.query(query, params);
    const like = result[0];
    return like ? { likeId: like.id } : null;
  }

  async getLikesAndDislikesCount(
    parentId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    if (!this.isCorrectNumber(parentId)) {
      return { likesCount: 0, dislikesCount: 0 };
    }
    const query = `
      SELECT 
          parent_id,
          parent_type,
          COUNT(*) FILTER (WHERE like_status = 'Like') AS like_count,
          COUNT(*) FILTER (WHERE like_status = 'Dislike') AS dislike_count
      FROM likes
      WHERE parent_id = $1
      GROUP BY parent_id, parent_type
      ORDER BY parent_type, parent_id;
    `;
    const params = [parentId];
    const result = await this.dataSource.query(query, params);
    const { like_count, dislike_count } = result[0];
    return result[0]
      ? { likesCount: like_count, dislikesCount: dislike_count }
      : { likesCount: 0, dislikesCount: 0 };
  }
}
