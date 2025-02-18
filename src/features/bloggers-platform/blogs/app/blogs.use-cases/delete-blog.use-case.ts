import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastucture/blogs.repository';

export class DeleteBlogCommand {
  constructor(public id: string) {}
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
