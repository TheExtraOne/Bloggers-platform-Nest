import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';
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

    // Check if post exists
    const post = await this.pgPostsRepository.findPostById(postId);
    if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    // Check if user exists
    const user = await this.pgUsersRepository.findUserById(userId);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    const newComment = await this.pgCommentsRepository.createComment(
      postId,
      userId,
      dto.content,
    );
    return newComment.commentId;
  }
}
