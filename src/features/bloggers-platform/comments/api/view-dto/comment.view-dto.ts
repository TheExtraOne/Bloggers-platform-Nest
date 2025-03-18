import { LikeStatus } from '../../../likes/infrastructure/pg.likes.repository';
import { TPgComment } from '../../infrastructure/query/pg.comments.query-repository';

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

  static mapToView(comment: TPgComment): PgCommentsViewDto {
    const dto = new PgCommentsViewDto();

    dto.id = comment.id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.commentator_id.toString(),
      userLogin: comment.commentator_login,
    };
    dto.createdAt = comment.created_at;
    dto.likesInfo = {
      likesCount: comment.likes_count ?? 0,
      dislikesCount: comment.dislikes_count ?? 0,
      myStatus: LikeStatus.None,
    };

    return dto;
  }
}
