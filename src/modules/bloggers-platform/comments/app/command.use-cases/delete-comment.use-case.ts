import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ERRORS } from '../../../../../constants';
import { PgCommentsRepository } from '../../infrastructure/pg.comments.repository';

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
    const comment: {
      commentId: string;
      commentatorId: string;
    } | null = await this.pgCommentsRepository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    // Check, that user is able to update the comment
    if (comment.commentatorId !== userId) {
      throw new ForbiddenException();
    }

    await this.pgCommentsRepository.deleteComment(commentId, userId);
  }
}
