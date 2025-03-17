import { ForbiddenException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MgCommentsRepository } from '../../infrastructure/mg.comments.repository';

export class DeleteCommentCommand extends Command<void> {
  constructor(
    public commentId: string,
    public userId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(private readonly mgCommentsRepository: MgCommentsRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { commentId, userId } = command;
    // Check, that comment exists
    const comment = await this.mgCommentsRepository.findCommentById(commentId);

    // Check, that user is able to delete the comment
    if (comment.commentatorInfo.userId !== userId)
      throw new ForbiddenException();

    comment.makeDeleted();

    await this.mgCommentsRepository.save(comment);
  }
}
