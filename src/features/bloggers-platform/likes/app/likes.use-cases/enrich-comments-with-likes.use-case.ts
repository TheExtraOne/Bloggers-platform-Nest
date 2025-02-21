import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { LikesService } from '../likes.service';

export class EnrichCommentsWithLikesCommand extends Command<
  PaginatedViewDto<CommentsViewDto[]>
> {
  constructor(
    public readonly comments: PaginatedViewDto<CommentsViewDto[]>,
    public readonly userId: string | null,
  ) {
    super();
  }
}

@CommandHandler(EnrichCommentsWithLikesCommand)
export class EnrichCommentsWithLikesUseCase
  implements
    ICommandHandler<
      EnrichCommentsWithLikesCommand,
      PaginatedViewDto<CommentsViewDto[]>
    >
{
  constructor(private readonly likesService: LikesService) {}

  async execute(
    command: EnrichCommentsWithLikesCommand,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const { comments, userId } = command;
    return this.likesService.enrichMultipleEntitiesWithLikeStatus(
      comments,
      userId,
    );
  }
}
