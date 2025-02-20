import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { LikeStatus } from '../../domain/like.entity';

export class EnrichCommentWithLikeCommand {
  constructor(
    public readonly comment: CommentsViewDto,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(EnrichCommentWithLikeCommand)
export class EnrichCommentWithLikeUseCase
  implements ICommandHandler<EnrichCommentWithLikeCommand, CommentsViewDto>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: EnrichCommentWithLikeCommand): Promise<CommentsViewDto> {
    const { comment, userId } = command;

    // If there's no jwt - returning default (NONE) status
    if (!userId) return comment;

    // Get user's like status for this comment
    const myStatus = await this.getUserStatus(userId, comment.id);

    // Add user's like status to the comment
    return {
      ...comment,
      likesInfo: {
        ...comment.likesInfo,
        myStatus,
      },
    };
  }

  private async getUserStatus(userId: string, entityId: string): Promise<LikeStatus> {
    const like = await this.likesRepository.findLikeByAuthorIdAndParentId(
      userId,
      entityId,
    );

    return like ? (like.status as LikeStatus) : LikeStatus.None;
  }
}
