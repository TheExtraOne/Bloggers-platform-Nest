import { IsStringWithTrim } from 'src/core/decorators/is-not-empty-string';
import { LikeStatus } from '../../../likes/infrastructure/pg.likes.repository';
import { IsEnum } from 'class-validator';

export class UpdateLikeStatusInputDto {
  @IsStringWithTrim()
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
