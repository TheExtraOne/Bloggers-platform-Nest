import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { CreateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class CreateBlogCommand extends Command<string> {
  constructor(public dto: CreateBlogInputDto) {
    super();
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const { name, description, websiteUrl } = command.dto;
    const newBlog = this.BlogModel.createInstance({
      name,
      description,
      websiteUrl,
    });
    await this.blogsRepository.save(newBlog);

    return newBlog._id.toString();
  }
}
