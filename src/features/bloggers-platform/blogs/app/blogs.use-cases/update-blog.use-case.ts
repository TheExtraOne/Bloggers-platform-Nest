import { UpdateBlogInputDto } from '../../api/input-dto/blogs.input-dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { MgBlogsRepository } from '../../infrastructure/mg.blogs.repository';
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
  constructor(
    // private readonly mgBlogsRepository: MgBlogsRepository,
    private pgBlogsRepository: PgBlogsRepository,
  ) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const { id, dto } = command;
    // For MongoDb
    // const blog = await this.mgBlogsRepository.findBlogById(id);
    // const blog
    // blog.update({
    //   name: dto.name,
    //   description: dto.description,
    //   websiteUrl: dto.websiteUrl,
    // });
    // await this.mgBlogsRepository.save(blog);

    // For Postgres
    const blog = await this.pgBlogsRepository.getBlogById(id);
    if (!blog) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    await this.pgBlogsRepository.updateBlog(id, dto);
  }
}
