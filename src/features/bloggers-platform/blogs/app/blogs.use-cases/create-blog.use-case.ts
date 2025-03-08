// import { InjectModel } from '@nestjs/mongoose';
// import { Blog, BlogModelType } from '../../domain/blog.entity';
import { CreateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { MgBlogsRepository } from '../../infrastructure/mg.blogs.repository';
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
  constructor(
    // @InjectModel(Blog.name) private BlogModel: BlogModelType,
    // private readonly mgBlogsRepository: MgBlogsRepository,
    private readonly pgBlogsRepository: PgBlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const { name, description, websiteUrl } = command.dto;
    // For MongoDb
    // const newBlog = this.BlogModel.createInstance({
    //   name,
    //   description,
    //   websiteUrl,
    // });
    // await this.mgBlogsRepository.save(newBlog);

    // return newBlog._id.toString();

    // For Postgres
    const { blogId } = await this.pgBlogsRepository.createBlog({
      name,
      description,
      websiteUrl,
    });

    return blogId;
  }
}
