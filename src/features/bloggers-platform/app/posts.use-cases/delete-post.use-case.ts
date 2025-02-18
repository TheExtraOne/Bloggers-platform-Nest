import { PostsRepository } from '../../infrastructure/posts.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeletePostCommand {
  constructor(public id: string) {}
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
