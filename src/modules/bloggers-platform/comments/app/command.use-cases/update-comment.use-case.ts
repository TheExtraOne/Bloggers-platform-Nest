import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { ForbiddenException } from '@nestjs/common';
import { PgCommentsRepository } from '../../infrastructure/pg.comments.repository';
import { Comments } from '../../domain/entities/comment.entity';

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
  constructor(private readonly pgCommentsRepository: PgCommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const { commentId, userId, dto } = command;

    // Check, that comment exists
    const comment: Comments =
      await this.pgCommentsRepository.findCommentByIdOrThrow(commentId);

    // Check, that user is able to update the comment
    if (comment.user.id.toString() !== userId) {
      throw new ForbiddenException();
    }

    await this.pgCommentsRepository.updateComment(commentId, dto.content);
  }
}
