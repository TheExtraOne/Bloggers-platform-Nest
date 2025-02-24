import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';
import { UsersRepository } from '../../../../user-accounts/users/infrastructure/users.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { CommentsRepository } from '../../infrastructure/comments.repository';

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
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    const { postId, userId, dto } = command;

    // Check if post exists
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    // Check if user exists
    const user = await this.usersRepository.findUserById(userId);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    const newComment = this.CommentModel.createInstance({
      content: dto.content,
      postId: postId,
      commentatorInfo: {
        userId: userId,
        userLogin: user.login,
      },
    });

    await this.commentsRepository.save(newComment);

    return newComment._id.toString();
  }
}
