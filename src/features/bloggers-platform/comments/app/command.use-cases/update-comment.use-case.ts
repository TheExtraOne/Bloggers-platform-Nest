import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentInputDto } from '../../api/input-dto/comment.input.dto';
import { ForbiddenException } from '@nestjs/common';
import { PgCommentsRepository } from '../../infrastructure/pg.comments.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';

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

    // For Mongo
    // Check, that comment exists
    // const comment = await this.mgCommentsRepository.findCommentById(commentId);
    // // Check, that user is able to update the comment
    // if (comment.commentatorInfo.userId !== userId)
    //   throw new ForbiddenException();
    // comment.update(dto);
    // await this.mgCommentsRepository.save(comment);

    // For Postgres
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

    await this.pgCommentsRepository.updateComment(
      commentId,
      userId,
      dto.content,
    );
  }
}
