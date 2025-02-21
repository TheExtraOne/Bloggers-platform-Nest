import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { ForbiddenException } from '@nestjs/common';

export class UpdateCommentCommand extends Command<void> {
  constructor(
    public commentId: string,
    public userId: string,
    public dto: UpdateCommentInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const { commentId, userId, dto } = command;
    // Check, that comment exists
    const comment = await this.commentsRepository.findCommentById(commentId);

    // Check, that user is able to update the comment
    if (comment.commentatorInfo.userId !== userId)
      throw new ForbiddenException();

    comment.update(dto);

    await this.commentsRepository.save(comment);
  }
}
