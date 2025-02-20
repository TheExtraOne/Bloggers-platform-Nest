import { LikeStatus } from '../like.entity';

export class CreateLikeDto {
  status: LikeStatus;
  login: string;
  userId: string;
  parentId: string;
}
