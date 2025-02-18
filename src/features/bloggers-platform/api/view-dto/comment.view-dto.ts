import { CommentDocument } from '../../domain/comment.entity';

type TCommentatorInfo = {
  userId: string;
  userLogin: string;
};
type TLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: 'Like' | 'Dislike' | 'None';
};

export class CommentsViewDto {
  id: string;
  content: string;
  commentatorInfo: TCommentatorInfo;
  createdAt: Date;
  likesInfo: TLikesInfo;

  static mapToView(comment: CommentDocument): CommentsViewDto {
    const dto = new CommentsViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = comment.commentatorInfo;
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesInfo.likesCount,
      dislikesCount: comment.likesInfo.dislikesCount,
      myStatus: 'None',
    };

    return dto;
  }
}
