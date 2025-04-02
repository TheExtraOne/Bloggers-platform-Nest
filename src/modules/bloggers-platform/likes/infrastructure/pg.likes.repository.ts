import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { DataSource, Repository } from 'typeorm';
import { LikeStatus } from '../domain/enums/like-status.enum';
import { EntityType } from '../domain/enums/entity-type.enum';
import { CommentLikes } from '../domain/entities/comment-like.entity';
import { PostLikes } from '../domain/entities/post-like.entity';
import { Comments } from '../../comments/domain/entities/comment.entity';
import { Posts } from '../../posts/domain/entities/post.entity';
import { Users } from 'src/modules/user-accounts/users/domain/entities/user.entity';

@Injectable()
export class PgLikesRepository extends PgBaseRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CommentLikes)
    private readonly commentLikeRepository: Repository<CommentLikes>,
    @InjectRepository(PostLikes)
    private readonly postLikeRepository: Repository<PostLikes>,
  ) {
    super();
  }

  async createLike(dto: {
    user: Users;
    parent: Comments | Posts;
    status: LikeStatus;
    entityType: EntityType;
  }): Promise<void> {
    const { user, parent, status, entityType } = dto;
    if (entityType === EntityType.Comment) {
      const newCommentLike = new CommentLikes();

      newCommentLike.user = user;
      newCommentLike.comment = parent as Comments;
      newCommentLike.likeStatus = status;

      await this.commentLikeRepository.save(newCommentLike);
    } else {
      const newPostLike = new PostLikes();

      newPostLike.user = user;
      newPostLike.post = parent as Posts;
      newPostLike.likeStatus = status;

      await this.postLikeRepository.save(newPostLike);
    }
  }

  async findLikeByAuthorIdAndParentId(
    userId: string,
    parentId: string,
    entityType: EntityType,
  ): Promise<CommentLikes | null | PostLikes> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectNumber(parentId)) {
      return null;
    }
    if (entityType === EntityType.Comment) {
      return await this.commentLikeRepository.findOne({
        where: {
          user: {
            id: +userId,
          },
          comment: {
            id: +parentId,
          },
        },
      });
    }
    if (entityType === EntityType.Post) {
      return await this.postLikeRepository.findOne({
        where: {
          user: {
            id: +userId,
          },
          post: {
            id: +parentId,
          },
        },
      });
    }
    return null;
  }
  // TODO
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
  // TODO
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

  async updateLikeStatus(
    like: CommentLikes | PostLikes,
    newStatus: LikeStatus,
    entityType: EntityType,
  ): Promise<void> {
    like.likeStatus = newStatus;
    if (entityType === EntityType.Comment) {
      await this.commentLikeRepository.save(like);
    }
    if (entityType === EntityType.Post) {
      await this.postLikeRepository.save(like);
    }
  }
}
