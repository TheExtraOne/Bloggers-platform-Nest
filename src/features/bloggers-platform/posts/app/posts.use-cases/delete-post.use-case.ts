import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgPostsRepository } from '../../infrastructure/pg.posts.repository';

export class DeletePostCommand extends Command<void> {
  constructor(
    public postId: string,
    public blogId: string,
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
    // For MongoDb
    // const post = await this.postsRepository.findPostById(command.id);
    // post.makeDeleted();
    // await this.postsRepository.save(post);

    // For Postgres
    await this.pgPostsRepository.deletePost(postId, blogId);
  }
}
