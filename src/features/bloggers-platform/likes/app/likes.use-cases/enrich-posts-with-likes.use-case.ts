import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { LikeStatus } from '../../domain/like.entity';

export class EnrichPostsWithLikesCommand {
  constructor(
    public readonly posts: PaginatedViewDto<PostsViewDto[]>,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(EnrichPostsWithLikesCommand)
export class EnrichPostsWithLikesUseCase
  implements ICommandHandler<EnrichPostsWithLikesCommand, PaginatedViewDto<PostsViewDto[]>>
{
  constructor(
    private readonly likesRepository: LikesRepository,
  ) {}

  async execute(
    command: EnrichPostsWithLikesCommand,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    const { posts, userId } = command;

    // If there's no jwt - returning default (NONE) status
    if (!userId) return posts;

    const userLikes = await this.likesRepository.findAllLikesByAuthorId(userId);
    
    // Add user's like status to each post
    return {
      ...posts,
      items: posts.items.map((post) => {
        const like = userLikes?.find((like) => like.parentId === post.id);
        return {
          ...post,
          extendedLikesInfo: {
            ...post.extendedLikesInfo,
            myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
          },
        };
      }),
    };
  }
}
