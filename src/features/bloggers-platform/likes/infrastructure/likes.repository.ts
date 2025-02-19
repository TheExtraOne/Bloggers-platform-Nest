import { Injectable } from '@nestjs/common';
import {
  Like,
  LikeDocument,
  LikeModelType,
  LikeStatus,
} from '../domain/like.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  async save(like: LikeDocument): Promise<void> {
    await like.save();
  }

  async findLikeByUserIdAndParentId(
    authorId: string,
    parentId: string,
  ): Promise<LikeDocument | null> {
    const like = await this.LikeModel.findOne({
      authorId,
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

  async findDislikesByParentId(parentId: string): Promise<LikeDocument[]> {
    const dislikes = await this.LikeModel.find({
      parentId,
      deletedAt: null,
      status: LikeStatus.Dislike,
    });

    return dislikes;
  }

  async findLikesByAuthorId(authorId: string): Promise<LikeDocument[]> {
    const likes = await this.LikeModel.find({
      authorId,
      deletedAt: null,
    });

    return likes;
  }
}
