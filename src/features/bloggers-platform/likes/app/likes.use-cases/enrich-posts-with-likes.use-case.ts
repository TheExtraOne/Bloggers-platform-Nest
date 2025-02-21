import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { LikesService } from '../likes.service';

export class EnrichPostsWithLikesCommand extends Command<
  PaginatedViewDto<PostsViewDto[]>
> {
  constructor(
    public readonly posts: PaginatedViewDto<PostsViewDto[]>,
    public readonly userId: string | null,
  ) {
    super();
  }
}

@CommandHandler(EnrichPostsWithLikesCommand)
export class EnrichPostsWithLikesUseCase
  implements
    ICommandHandler<
      EnrichPostsWithLikesCommand,
      PaginatedViewDto<PostsViewDto[]>
    >
{
  constructor(private readonly likesService: LikesService) {}

  async execute(
    command: EnrichPostsWithLikesCommand,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    const { posts, userId } = command;
    return this.likesService.enrichMultipleEntitiesWithLikeStatus(
      posts,
      userId,
    );
  }
}
