import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PgBlogsRepository } from '../../../blogs/infrastructure/pg.blogs.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from 'src/constants';
import { PgPostsRepository } from '../../infrastructure/pg.posts.repository';

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

    // Check that blog exists
    const blogExists = await this.pgBlogsRepository.checkBlogExists(blogId);
    if (!blogExists) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const result: {
      postId: string;
    } = await this.pgPostsRepository.createPost({
      blogId,
      title,
      content,
      shortDescription,
    });

    return result.postId;
  }
}
