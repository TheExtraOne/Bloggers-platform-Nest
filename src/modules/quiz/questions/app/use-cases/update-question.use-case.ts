import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';
import { UpdateQuestionInputDto } from '../../api/input-dto/update-question.input-dto';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { LOCK_MODES } from '../../../../../constants';

export class UpdateQuestionCommand extends Command<void> {
  constructor(
    public readonly dto: {
      id: string;
      updateQuestionDto: UpdateQuestionInputDto;
    },
  ) {
    super();
  }
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  extends AbstractTransactionalUseCase<UpdateQuestionCommand, void>
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(
    private readonly pgQuestionsRepository: PgQuestionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async executeInTransaction(
    command: UpdateQuestionCommand,
    manager: EntityManager,
  ) {
    const { id, updateQuestionDto } = command.dto;
    const question = await this.pgQuestionsRepository.findQuestionByIdOrThrow(
      id,
      manager,
      LOCK_MODES.PESSIMISTIC_WRITE,
    );

    question.body = updateQuestionDto.body;
    question.correctAnswers = updateQuestionDto.correctAnswers;

    await this.pgQuestionsRepository.save(question, manager);
  }
}
