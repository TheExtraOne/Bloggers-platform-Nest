import { CreateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgBlogsRepository } from '../../infrastructure/pg.blogs.repository';

export class CreateBlogCommand extends Command<string> {
  constructor(public dto: CreateBlogInputDto) {
    super();
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(private readonly pgBlogsRepository: PgBlogsRepository) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const { name, description, websiteUrl } = command.dto;
    const { blogId } = await this.pgBlogsRepository.createBlog({
      name,
      description,
      websiteUrl,
    });

    return blogId;
  }
}
