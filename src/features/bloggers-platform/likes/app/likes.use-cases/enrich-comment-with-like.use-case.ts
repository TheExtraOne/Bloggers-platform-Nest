import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { LikesService } from '../likes.service';

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
  constructor(private readonly likesService: LikesService) {}

  async execute(command: EnrichCommentWithLikeCommand): Promise<CommentsViewDto> {
    const { comment, userId } = command;
    return this.likesService.enrichSingleEntityWithLikeStatus(comment, userId);
  }
}
