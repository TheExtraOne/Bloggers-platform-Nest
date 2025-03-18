import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostInputDto } from '../../api/input-dto/posts.input-dto';
import { PgPostsRepository } from '../../infrastructure/pg.posts.repository';

export class UpdatePostCommand extends Command<void> {
  constructor(
    public blogId: string,
    public postId: string,
    public dto: UpdatePostInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(private readonly pgPostsRepository: PgPostsRepository) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const { blogId, postId, dto } = command;

    await this.pgPostsRepository.updatePost(postId, blogId, dto);
  }
}
