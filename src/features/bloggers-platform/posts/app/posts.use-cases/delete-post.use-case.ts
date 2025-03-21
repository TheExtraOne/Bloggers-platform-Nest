import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgPostsRepository } from '../../infrastructure/pg.posts.repository';

export class DeletePostCommand extends Command<void> {
  constructor(
    public blogId: string,
    public postId: string,
  ) {
    super();
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(private readonly pgPostsRepository: PgPostsRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const { postId, blogId } = command;

    await this.pgPostsRepository.deletePost(postId, blogId);
  }
}
