// import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { MgPostsViewDto } from '../../../posts/api/view-dto/posts.view-dto';
// import { LikesService } from '../likes.service';

// export class EnrichPostWithLikeCommand extends Command<MgPostsViewDto> {
//   constructor(
//     public readonly post: MgPostsViewDto,
//     public readonly userId: string | null,
//   ) {
//     super();
//   }
// }

// @CommandHandler(EnrichPostWithLikeCommand)
// export class EnrichPostWithLikeUseCase
//   implements ICommandHandler<EnrichPostWithLikeCommand, MgPostsViewDto>
// {
//   constructor(private readonly likesService: LikesService) {}

//   async execute(command: EnrichPostWithLikeCommand): Promise<MgPostsViewDto> {
//     const { post, userId } = command;
//     return this.likesService.enrichSingleEntityWithLikeStatus(post, userId);
//   }
// }
