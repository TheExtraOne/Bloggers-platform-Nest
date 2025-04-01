import { LikeStatus } from '../../../likes/domain/enums/like-status.enum';
import { Posts } from '../../domain/entities/post.entity';

type TExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: { addedAt: Date; userId: string; login: string }[];
};

export class PgPostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: TExtendedLikesInfo;

  static mapToView(post: Posts): PgPostsViewDto {
    const dto = new PgPostsViewDto();

    dto.id = post.id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.createdAt = post.createdAt;
    dto.blogId = post.blog.id.toString();
    dto.blogName = post.blog.name;
    dto.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };

    return dto;
  }
}
