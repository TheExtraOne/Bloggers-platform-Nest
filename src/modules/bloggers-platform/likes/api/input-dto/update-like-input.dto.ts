import { IsStringWithTrim } from 'src/core/decorators/is-not-empty-string';
import { LikeStatus } from '../../domain/enums/like-status.enum';
import { IsEnum } from 'class-validator';

export class UpdateLikeStatusInputDto {
  @IsStringWithTrim()
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
