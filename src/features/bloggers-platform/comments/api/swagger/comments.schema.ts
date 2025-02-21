import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

export class CommentatorInfo {
  @ApiProperty({
    description: 'ID of the user who created the comment',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Login of the user who created the comment',
    type: String,
  })
  userLogin: string;
}

export class LikesInfo {
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
}

export class CommentViewModel {
  @ApiProperty({
    description: 'Comment ID',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Comment content',
    type: String,
  })
  content: string;

  @ApiProperty({
    description: 'Information about the comment creator',
    type: CommentatorInfo,
  })
  commentatorInfo: CommentatorInfo;

  @ApiProperty({
    description: 'Comment creation date',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Information about likes',
    type: LikesInfo,
  })
  likesInfo: LikesInfo;
}
