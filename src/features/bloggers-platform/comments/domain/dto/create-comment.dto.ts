type TCommentatorInfo = {
  userId: string;
  userLogin: string;
};

export class CreateCommentDto {
  content: string;
  postId: string;
  commentatorInfo: TCommentatorInfo;
}
