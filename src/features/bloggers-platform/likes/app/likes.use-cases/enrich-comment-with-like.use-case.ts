import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { LikesService } from '../likes.service';

export class EnrichCommentWithLikeCommand extends Command<CommentsViewDto> {
  constructor(
    public readonly comment: CommentsViewDto,
    public readonly userId: string | null,
  ) {
    super();
  }
}

@CommandHandler(EnrichCommentWithLikeCommand)
export class EnrichCommentWithLikeUseCase
  implements ICommandHandler<EnrichCommentWithLikeCommand, CommentsViewDto>
{
  constructor(private readonly likesService: LikesService) {}

  async execute(
    command: EnrichCommentWithLikeCommand,
  ): Promise<CommentsViewDto> {
    const { comment, userId } = command;
    return this.likesService.enrichSingleEntityWithLikeStatus(comment, userId);
  }
}
