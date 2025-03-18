import { LikeStatus } from 'src/features/bloggers-platform/likes/domain/like.entity';
import { PostDocument } from '../../domain/post.entity';
import { TPgPost } from '../../infrastructure/query/pg.posts.query-repository';

type TExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: { addedAt: Date; userId: string; login: string }[];
};

// TODO: clean mongo data
export class MgPostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: TExtendedLikesInfo;

  static mapToView(post: PostDocument): MgPostsViewDto {
    const dto = new MgPostsViewDto();

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
// TODO: check relations between tables, maybe we need to add/remove primary key
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
      likesCount: post.likes_count ?? 0,
      dislikesCount: post.dislikes_count ?? 0,
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
