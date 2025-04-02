import { LikeStatus } from '../../../likes/domain/enums/like-status.enum';
import { Comments } from '../../domain/entities/comment.entity';

type TCommentatorInfo = {
  userId: string;
  userLogin: string;
};
type TLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
};

export class PgCommentsViewDto {
  id: string;
  content: string;
  commentatorInfo: TCommentatorInfo;
  createdAt: Date;
  likesInfo: TLikesInfo;

  static mapToView(
    comment: Comments & { likesCount: number; dislikesCount: number },
  ): PgCommentsViewDto {
    const dto = new PgCommentsViewDto();

    dto.id = comment.id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.user.id.toString(),
      userLogin: comment.user.login,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesCount ?? 0,
      dislikesCount: comment.dislikesCount ?? 0,
      myStatus: LikeStatus.None,
    };

    return dto;
  }
}
