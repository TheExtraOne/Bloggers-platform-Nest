import { LikeStatus } from '../like.entity';

export class CreateLikeDto {
  status: LikeStatus;
  authorLogin: string;
  authorId: string;
  parentId: string;
}
