import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

@Injectable()
export class PgLikesRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createLike(dto: {
    userId: string;
    parentId: string;
    status: LikeStatus;
  }): Promise<void> {
    const query = `
      INSERT INTO public.likes (user_id, parent_id, like_status)
      VALUES ($1, $2, $3)`;
    const values = [dto.userId, dto.parentId, dto.status];

    await this.dataSource.query(query, values);
  }

  async findLikeByAuthorIdAndParentId(
    userId: string,
    parentId: string,
  ): Promise<{ likeId: string; status: LikeStatus } | null> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectNumber(parentId)) {
      return null;
    }
    const query = `
      SELECT likes.*
      FROM public.likes as likes
      WHERE likes.user_id = $1
      AND likes.parent_id = $2
    `;

    const params = [userId, parentId];
    const result = await this.dataSource.query(query, params);
    const like = result[0];
    return like ? { likeId: like.id, status: like.like_status } : null;
  }

  async findLikesByAuthorIdAndParentIdArray(
    userId: string,
    parentIds: string[],
  ): Promise<
    | {
        id: number;
        user_id: string;
        parent_id: string;
        created_at: Date;
        updated_at: Date;
        like_status: LikeStatus;
      }[]
    | []
  > {
    if (
      !this.isCorrectNumber(userId) ||
      !parentIds.every(this.isCorrectNumber)
    ) {
      return [];
    }
    const query = `
      SELECT likes.*
      FROM public.likes as likes
      WHERE likes.user_id = $1
      AND likes.parent_id = ANY($2)
    `;

    const params = [userId, parentIds];
    const result = await this.dataSource.query(query, params);

    return result.length ? result : [];
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
          COUNT(*) FILTER (WHERE like_status = 'Like') AS like_count,
          COUNT(*) FILTER (WHERE like_status = 'Dislike') AS dislike_count
      FROM likes
      WHERE parent_id = $1
      GROUP BY parent_id
      ORDER BY parent_id;
    `;
    const params = [parentId];
    const result = await this.dataSource.query(query, params);
    const { like_count, dislike_count } = result[0];
    return result[0]
      ? { likesCount: like_count, dislikesCount: dislike_count }
      : { likesCount: 0, dislikesCount: 0 };
  }

  async updateLikeStatus(likeId: string, newStatus: LikeStatus): Promise<void> {
    if (!this.isCorrectNumber(likeId)) {
      return;
    }
    const query = `
      UPDATE public.likes
      SET like_status = $1, updated_at = NOW()
      WHERE id = $2
    `;
    const params = [newStatus, likeId];
    await this.dataSource.query(query, params);
  }
}
