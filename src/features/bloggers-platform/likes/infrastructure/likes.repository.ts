import { Injectable } from '@nestjs/common';
import {
  Like,
  LikeDocument,
  LikeModelType,
  LikeStatus,
} from '../domain/like.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  async save(like: LikeDocument): Promise<void> {
    await like.save();
  }

  async findLikeByAuthorIdAndParentId(
    userId: string,
    parentId: string,
  ): Promise<LikeDocument | null> {
    const like = await this.LikeModel.findOne({
      userId,
      parentId,
      deletedAt: null,
    });

    return like;
  }

  async findLikesByParentId(parentId: string): Promise<LikeDocument[]> {
    const likes = await this.LikeModel.find({
      parentId,
      deletedAt: null,
      status: LikeStatus.Like,
    });

    return likes;
  }

  async getLikesByParentIdWithDateSort({
    parentId,
    sortDirection = SortDirection.Desc,
    status = LikeStatus.Like,
  }: {
    parentId: string;
    sortDirection?: SortDirection;
    status?: LikeStatus;
  }) {
    const likes = await this.LikeModel.find({
      parentId: parentId,
      status: status,
      deletedAt: null,
    })
      .sort({ addedAt: sortDirection === SortDirection.Asc ? 1 : -1 })
      .lean();

    return likes;
  }

  async findDislikesByParentId(parentId: string): Promise<LikeDocument[]> {
    const dislikes = await this.LikeModel.find({
      parentId,
      deletedAt: null,
      status: LikeStatus.Dislike,
    });

    return dislikes;
  }

  async findLikesByAuthorId(userId: string): Promise<LikeDocument[]> {
    const likes = await this.LikeModel.find({
      userId,
      deletedAt: null,
    });

    return likes;
  }

  async findAllLikesByAuthorId(userId: string): Promise<LikeDocument[]> {
    const likes = await this.LikeModel.find({
      userId,
      deletedAt: null,
    });

    return likes;
  }

  async getLikesAndDislikesCount(parentId: string): Promise<{ likesCount: number; dislikesCount: number }> {
    const [result] = await this.LikeModel.aggregate([
      {
        $match: {
          parentId,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          likesCount: {
            $sum: {
              $cond: [{ $eq: ['$_id', LikeStatus.Like] }, '$count', 0],
            },
          },
          dislikesCount: {
            $sum: {
              $cond: [{ $eq: ['$_id', LikeStatus.Dislike] }, '$count', 0],
            },
          },
        },
      },
    ]) || { likesCount: 0, dislikesCount: 0 };

    return {
      likesCount: result?.likesCount ?? 0,
      dislikesCount: result?.dislikesCount ?? 0,
    };
  }
}
