import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from '../../../../../features/bloggers-platform/blogs/app/blog-service';
import { UpdatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class UpdatePostCommand extends Command<void> {
  constructor(
    public id: string,
    public dto: UpdatePostInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsService: BlogsService,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const { id, dto } = command;
    const post = await this.postsRepository.findPostById(id);
    const blog = await this.blogsService.getBlogById(dto.blogId);

    post.update({
      blogId: dto.blogId,
      blogName: blog.name,
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
    });

    await this.postsRepository.save(post);
  }
}
