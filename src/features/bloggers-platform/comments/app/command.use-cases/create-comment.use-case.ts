import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';
import { PgPostsRepository } from '../../../posts/infrastructure/pg.posts.repository';
import { PgUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.users.repository';
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
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly pgCommentsRepository: PgCommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    const { postId, userId, dto } = command;

    // For Mongo
    // Check if post exists
    // const post = await this.postsRepository.findPostById(postId);
    // if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    // // Check if user exists
    // const user = await this.mgUsersRepository.findUserById(userId);
    // if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    // const newComment = this.CommentModel.createInstance({
    //   content: dto.content,
    //   postId: postId,
    //   commentatorInfo: {
    //     userId: userId,
    //     userLogin: user.login,
    //   },
    // });
    // await this.mgCommentsRepository.save(newComment);
    // return newComment._id.toString();

    // For Postgres
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
