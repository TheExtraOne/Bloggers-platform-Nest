import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgBlogsRepository } from '../../infrastructure/pg.blogs.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';

export class UpdateBlogCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateBlogInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private pgBlogsRepository: PgBlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const { id, dto } = command;

    const blog = await this.pgBlogsRepository.getBlogById(id);
    if (!blog) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    await this.pgBlogsRepository.updateBlog(id, dto);
  }
}
