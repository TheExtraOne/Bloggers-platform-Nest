import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgBlogsRepository } from '../../infrastructure/pg.blogs.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from 'src/constants';

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
    const blog = await this.pgBlogsRepository.getBlogById(command.id);
    if (!blog) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    await this.pgBlogsRepository.deleteBlog(command.id);
  }
}
