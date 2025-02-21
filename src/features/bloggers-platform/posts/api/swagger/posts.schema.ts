import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

export class NewestLikeInfo {
  @ApiProperty({
    description: 'Date when the like was added',
    type: Date,
  })
  addedAt: Date;

  @ApiProperty({
    description: 'ID of the user who liked the post',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Login of the user who liked the post',
    type: String,
  })
  login: string;
}

export class ExtendedLikesInfo {
  @ApiProperty({
    description: 'Number of likes',
    type: Number,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Number of dislikes',
    type: Number,
  })
  dislikesCount: number;

  @ApiProperty({
    description: 'Current user\'s like status',
    enum: LikeStatus,
    example: LikeStatus.None,
  })
  myStatus: LikeStatus;

  @ApiProperty({
    description: 'List of the newest likes',
    type: [NewestLikeInfo],
  })
  newestLikes: NewestLikeInfo[];
}

export class PostViewModel {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Post title',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Short description of the post',
    type: String,
  })
  shortDescription: string;

  @ApiProperty({
    description: 'Post content',
    type: String,
  })
  content: string;

  @ApiProperty({
    description: 'Blog ID',
    type: String,
  })
  blogId: string;

  @ApiProperty({
    description: 'Blog name',
    type: String,
  })
  blogName: string;

  @ApiProperty({
    description: 'Post creation date',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Extended information about likes',
    type: ExtendedLikesInfo,
  })
  extendedLikesInfo: ExtendedLikesInfo;
}
