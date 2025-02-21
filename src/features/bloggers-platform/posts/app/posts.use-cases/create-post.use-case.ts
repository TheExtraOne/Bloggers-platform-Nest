import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsService } from 'src/features/bloggers-platform/blogs/app/blog-service';
import { CreatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';

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
    @InjectModel(Post.name) private PostModel: PostModelType,
    private readonly blogsService: BlogsService,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const { blogId, title, content, shortDescription } = command.dto;
    const blog = await this.blogsService.getBlogById(blogId);
    const blogName = blog.name;

    const newPost = this.PostModel.createInstance({
      blogId: blogId,
      blogName: blogName,
      title: title,
      content: content,
      shortDescription: shortDescription,
    });

    await this.postsRepository.save(newPost);

    return newPost._id.toString();
  }
}
