import { LikeStatus } from '../../../likes/domain/enums/like-status.enum';

type TNewestLikes = { addedAt: Date; userId: string; login: string }[] | [];
export type TPost = {
  blog_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: null | Date;
  title: string;
  short_description: string;
  content: string;
  id: number;
  blog_name: string;
  likes_count: string;
  dislikes_count: string;
  newest_likes: TNewestLikes;
};

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

  static mapToView(post: TPost): PgPostsViewDto {
    const dto = new PgPostsViewDto();

    dto.id = post.id.toString();
    dto.title = post.title;
    dto.shortDescription = post.short_description;
    dto.content = post.content;
    dto.createdAt = post.created_at;
    dto.blogId = post.blog_id.toString();
    dto.blogName = post.blog_name;
    dto.extendedLikesInfo = {
      likesCount: +post.likes_count,
      dislikesCount: +post.dislikes_count,
      myStatus: LikeStatus.None,
      newestLikes:
        post.newest_likes.map((newLike) => ({
          ...newLike,
          userId: newLike.userId.toString(),
        })) ?? [],
    };

    return dto;
  }
}
