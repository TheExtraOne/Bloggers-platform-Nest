import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { LikeStatus } from '../../domain/like.entity';

export class EnrichPostWithLikeCommand {
  constructor(
    public readonly post: PostsViewDto,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(EnrichPostWithLikeCommand)
export class EnrichPostWithLikeUseCase
  implements ICommandHandler<EnrichPostWithLikeCommand, PostsViewDto>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: EnrichPostWithLikeCommand): Promise<PostsViewDto> {
    const { post, userId } = command;

    // If there's no jwt - returning default (NONE) status
    if (!userId) return post;

    const like = await this.likesRepository.findLikeByAuthorIdAndParentId(
      userId,
      post.id,
    );

    return {
      ...post,
      extendedLikesInfo: {
        ...post.extendedLikesInfo,
        myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
      },
    };
  }
}
