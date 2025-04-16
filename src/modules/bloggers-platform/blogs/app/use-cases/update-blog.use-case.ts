import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgBlogsRepository } from '../../infrastructure/pg.blogs.repository';

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

    await this.pgBlogsRepository.updateBlog(id, dto);
  }
}
