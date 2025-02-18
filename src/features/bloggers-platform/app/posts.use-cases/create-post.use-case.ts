import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { CreatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsService } from '../blog-service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreatePostCommand {
  constructor(public readonly dto: CreatePostInputDto) {}
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
