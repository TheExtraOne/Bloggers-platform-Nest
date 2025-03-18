import { LikeStatus } from 'src/features/bloggers-platform/likes/domain/like.entity';
import { CommentDocument } from '../../domain/comment.entity';
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

export class MgCommentsViewDto {
  id: string;
  content: string;
  commentatorInfo: TCommentatorInfo;
  createdAt: Date;
  likesInfo: TLikesInfo;

  static mapToView(comment: CommentDocument): MgCommentsViewDto {
    const dto = new MgCommentsViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = comment.commentatorInfo;
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesInfo.likesCount,
      dislikesCount: comment.likesInfo.dislikesCount,
      myStatus: LikeStatus.None,
    };

    return dto;
  }
}
