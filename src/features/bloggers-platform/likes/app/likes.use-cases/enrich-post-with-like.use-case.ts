import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';
import { LikesService } from '../likes.service';

export class EnrichPostWithLikeCommand extends Command<PostsViewDto> {
  constructor(
    public readonly post: PostsViewDto,
    public readonly userId: string | null,
  ) {
    super();
  }
}

@CommandHandler(EnrichPostWithLikeCommand)
export class EnrichPostWithLikeUseCase
  implements ICommandHandler<EnrichPostWithLikeCommand, PostsViewDto>
{
  constructor(private readonly likesService: LikesService) {}

  async execute(command: EnrichPostWithLikeCommand): Promise<PostsViewDto> {
    const { post, userId } = command;
    return this.likesService.enrichSingleEntityWithLikeStatus(post, userId);
  }
}
