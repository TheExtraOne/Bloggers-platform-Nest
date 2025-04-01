import { ForbiddenException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgCommentsRepository } from '../../infrastructure/pg.comments.repository';
import { Comments } from '../../domain/entities/comment.entity';

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
  constructor(private readonly pgCommentsRepository: PgCommentsRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { commentId, userId } = command;

    // Check, that comment exists
    const comment: Comments =
      await this.pgCommentsRepository.findCommentByIdOrThrow(commentId);

    // Check, that user is able to update the comment
    if (comment.user.id.toString() !== userId) {
      throw new ForbiddenException();
    }

    await this.pgCommentsRepository.deleteComment(commentId);
  }
}
