import { PostDocument } from '../../domain/post.entity';

export class PostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;

  static mapToView(post: PostDocument): PostsViewDto {
    const dto = new PostsViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.createdAt = post.createdAt;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;

    return dto;
  }
}
