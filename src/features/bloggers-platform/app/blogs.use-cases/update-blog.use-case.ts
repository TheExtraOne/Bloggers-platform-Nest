import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateBlogCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateBlogInputDto,
  ) {}
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
