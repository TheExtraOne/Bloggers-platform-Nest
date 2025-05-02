import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { DataSource, EntityManager } from 'typeorm';

export class DeleteQuestionCommand extends Command<void> {
  constructor(public readonly questionId: string) {
    super();
  }
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  extends AbstractTransactionalUseCase<DeleteQuestionCommand, void>
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(
    private readonly pgQuestionsRepository: PgQuestionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async executeInTransaction(
    command: DeleteQuestionCommand,
    manager: EntityManager,
  ) {
    const { questionId } = command;

    return await this.pgQuestionsRepository.deleteQuestion(questionId, manager);
  }
}
