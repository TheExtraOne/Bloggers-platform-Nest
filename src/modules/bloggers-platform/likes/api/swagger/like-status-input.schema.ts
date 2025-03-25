import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../infrastructure/pg.likes.repository';

export class UpdateLikeStatusInputModel {
  @ApiProperty({
    description: 'The like status to set',
    enum: LikeStatus,
    example: LikeStatus.Like,
  })
  likeStatus: LikeStatus;
}
