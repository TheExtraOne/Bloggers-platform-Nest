import { LikeStatus } from '../../../likes/infrastructure/pg.likes.repository';
import { TPgPost } from '../../infrastructure/query/pg.posts.query-repository';

type TExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: { addedAt: Date; userId: string; login: string }[];
};

// TODO: check all sql
// TODO: map (from snake to camel in the query)
export class PgPostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: TExtendedLikesInfo;

  static mapToView(post: TPgPost): PgPostsViewDto {
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
      newestLikes: post.recent_likes.length
        ? post.recent_likes.map((like) => ({
            ...like,
            userId: like.userId.toString(),
          }))
        : [],
    };

    return dto;
  }
}
