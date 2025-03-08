import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MgBlogsRepository } from '../../infrastructure/mg.blogs.repository';

export class DeleteBlogCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private readonly mgBlogsRepository: MgBlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    const blog = await this.mgBlogsRepository.findBlogById(command.id);
    blog.makeDeleted();

    await this.mgBlogsRepository.save(blog);
  }
}
