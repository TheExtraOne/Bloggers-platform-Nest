import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class DeleteBlogCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(command.id);
    blog.makeDeleted();

    await this.blogsRepository.save(blog);
  }
}
