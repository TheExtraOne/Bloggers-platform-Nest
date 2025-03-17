import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MgCommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { LikesService } from '../likes.service';

export class EnrichCommentWithLikeCommand extends Command<MgCommentsViewDto> {
  constructor(
    public readonly comment: MgCommentsViewDto,
    public readonly userId: string | null,
  ) {
    super();
  }
}

@CommandHandler(EnrichCommentWithLikeCommand)
export class EnrichCommentWithLikeUseCase
  implements ICommandHandler<EnrichCommentWithLikeCommand, MgCommentsViewDto>
{
  constructor(private readonly likesService: LikesService) {}

  async execute(
    command: EnrichCommentWithLikeCommand,
  ): Promise<MgCommentsViewDto> {
    const { comment, userId } = command;
    return this.likesService.enrichSingleEntityWithLikeStatus(comment, userId);
  }
}
