import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgBlogsRepository } from '../../infrastructure/pg.blogs.repository';

export class DeleteBlogCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private readonly pgBlogsRepository: PgBlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    await this.pgBlogsRepository.deleteBlog(command.id);
  }
}
