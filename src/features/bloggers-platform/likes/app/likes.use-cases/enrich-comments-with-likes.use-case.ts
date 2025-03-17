import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MgCommentsViewDto } from '../../../comments/api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { LikesService } from '../likes.service';

export class EnrichCommentsWithLikesCommand extends Command<
  PaginatedViewDto<MgCommentsViewDto[]>
> {
  constructor(
    public readonly comments: PaginatedViewDto<MgCommentsViewDto[]>,
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
      PaginatedViewDto<MgCommentsViewDto[]>
    >
{
  constructor(private readonly likesService: LikesService) {}

  async execute(
    command: EnrichCommentsWithLikesCommand,
  ): Promise<PaginatedViewDto<MgCommentsViewDto[]>> {
    const { comments, userId } = command;
    return this.likesService.enrichMultipleEntitiesWithLikeStatus(
      comments,
      userId,
    );
  }
}
