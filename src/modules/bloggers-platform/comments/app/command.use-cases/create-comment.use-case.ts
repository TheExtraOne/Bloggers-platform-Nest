import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { PgPostsRepository } from '../../../posts/infrastructure/pg.posts.repository';
import { PgExternalUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { PgCommentsRepository } from '../../infrastructure/pg.comments.repository';

export class CreateCommentCommand extends Command<string> {
  constructor(
    public postId: string,
    public userId: string,
    public dto: CreateCommentInputDto,
  ) {
    super();
  }
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private readonly pgPostsRepository: PgPostsRepository,
    private readonly pgUsersRepository: PgExternalUsersRepository,
    private readonly pgCommentsRepository: PgCommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    const { postId, userId, dto } = command;

    const post = await this.pgPostsRepository.findPostByIdOrThrow(postId);
    const user = await this.pgUsersRepository.findUserOrThrow(userId);

    const newComment = await this.pgCommentsRepository.createComment(
      post,
      user,
      dto.content,
    );

    return newComment.commentId;
  }
}
