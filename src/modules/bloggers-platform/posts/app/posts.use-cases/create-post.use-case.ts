import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PgBlogsRepository } from '../../../blogs/infrastructure/pg.blogs.repository';
import { PgPostsRepository } from '../../infrastructure/pg.posts.repository';
import { Blogs } from '../../../blogs/domain/entities/blog.entity';

export class CreatePostCommand extends Command<string> {
  constructor(public readonly dto: CreatePostInputDto) {
    super();
  }
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private readonly pgBlogsRepository: PgBlogsRepository,
    private readonly pgPostsRepository: PgPostsRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const { blogId, title, content, shortDescription } = command.dto;

    const blog: Blogs =
      await this.pgBlogsRepository.findBlogByIdOrThrow(blogId);

    const result: {
      postId: string;
    } = await this.pgPostsRepository.createPost({
      blog,
      title,
      content,
      shortDescription,
    });

    return result.postId;
  }
}
