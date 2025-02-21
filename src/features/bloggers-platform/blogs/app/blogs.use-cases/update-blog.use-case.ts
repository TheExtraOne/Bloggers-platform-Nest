import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

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
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const { id, dto } = command;
    const blog = await this.blogsRepository.findBlogById(id);
    blog.update({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogsRepository.save(blog);
  }
}
