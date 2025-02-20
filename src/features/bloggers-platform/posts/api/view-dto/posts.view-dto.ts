import { LikeStatus } from 'src/features/bloggers-platform/likes/domain/like.entity';
import { PostDocument } from '../../domain/post.entity';

type TExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: { addedAt: Date; userId: string; login: string }[];
};
export class PostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: TExtendedLikesInfo;

  static mapToView(post: PostDocument): PostsViewDto {
    const dto = new PostsViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.createdAt = post.createdAt;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.extendedLikesInfo = {
      likesCount: post.extendedLikesInfo.likesCount,
      dislikesCount: post.extendedLikesInfo.dislikesCount,
      myStatus: LikeStatus.None,
      newestLikes: post.extendedLikesInfo.newestLikes,
    };

    return dto;
  }
}
