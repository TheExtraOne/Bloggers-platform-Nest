import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { In, Repository } from 'typeorm';
import { LikeStatus } from '../domain/enums/like-status.enum';
import { EntityType } from '../domain/enums/entity-type.enum';
import { CommentLikes } from '../domain/entities/comment-like.entity';
import { PostLikes } from '../domain/entities/post-like.entity';
import { Comments } from '../../comments/domain/entities/comment.entity';
import { Posts } from '../../posts/domain/entities/post.entity';
import { Users } from '../../../user-accounts/users/domain/entities/user.entity';

@Injectable()
export class PgLikesRepository extends PgBaseRepository {
  constructor(
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

  async findLikesByAuthorIdAndParentIdArray(
    userId: string,
    parentIds: number[],
    entityType: EntityType,
  ): Promise<CommentLikes[] | PostLikes[] | []> {
    if (!this.isCorrectNumber(userId)) {
      return [];
    }

    if (entityType === EntityType.Comment) {
      return await this.commentLikeRepository.find({
        where: {
          user: {
            id: +userId,
          },
          comment: {
            id: In(parentIds),
          },
        },
        relations: ['comment'],
      });
    }
    if (entityType === EntityType.Post) {
      return await this.postLikeRepository.find({
        where: {
          user: {
            id: +userId,
          },
          post: {
            id: In(parentIds),
          },
        },
        relations: ['post'],
      });
    }

    return [];
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
