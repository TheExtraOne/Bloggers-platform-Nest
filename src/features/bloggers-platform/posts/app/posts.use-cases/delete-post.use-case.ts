import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class DeletePostCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postsRepository.findPostById(command.id);
    post.makeDeleted();

    await this.postsRepository.save(post);
  }
}
