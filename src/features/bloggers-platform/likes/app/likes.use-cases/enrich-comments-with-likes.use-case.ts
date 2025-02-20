import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { LikeStatus } from '../../domain/like.entity';

export class EnrichCommentsWithLikesCommand {
  constructor(
    public readonly comments: PaginatedViewDto<CommentsViewDto[]>,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(EnrichCommentsWithLikesCommand)
export class EnrichCommentsWithLikesUseCase
  implements ICommandHandler<EnrichCommentsWithLikesCommand, PaginatedViewDto<CommentsViewDto[]>>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(
    command: EnrichCommentsWithLikesCommand,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const { comments, userId } = command;

    // If there's no jwt - returning default (NONE) status
    if (!userId) return comments;

    // Get all user's likes
    const userLikes = await this.likesRepository.findAllLikesByAuthorId(userId);
    
    // Add user's like status to each comment
    return {
      ...comments,
      items: comments.items.map((comment) => {
        const like = userLikes?.find((like) => like.parentId === comment.id);
        return {
          ...comment,
          likesInfo: {
            ...comment.likesInfo,
            myStatus: (like?.status as LikeStatus) ?? LikeStatus.None,
          },
        };
      }),
    };
  }
}
