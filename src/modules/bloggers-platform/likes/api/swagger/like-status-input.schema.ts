import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../domain/enums/like-status.enum';

export class UpdateLikeStatusInputModel {
  @ApiProperty({
    description: 'The like status to set',
    enum: LikeStatus,
    example: LikeStatus.Like,
  })
  likeStatus: LikeStatus;
}
