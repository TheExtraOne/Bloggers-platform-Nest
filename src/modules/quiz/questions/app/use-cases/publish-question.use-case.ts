import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { LOCK_MODES } from '../../../../../constants';

export class PublishQuestionCommand extends Command<void> {
  constructor(public readonly dto: { id: string; isPublished: boolean }) {
    super();
  }
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  extends AbstractTransactionalUseCase<PublishQuestionCommand, void>
  implements ICommandHandler<PublishQuestionCommand>
{
  constructor(
    private readonly pgQuestionsRepository: PgQuestionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async executeInTransaction(
    command: PublishQuestionCommand,
    manager: EntityManager,
  ) {
    const { id, isPublished } = command.dto;

    const question = await this.pgQuestionsRepository.findQuestionByIdOrThrow(
      id,
      manager,
      LOCK_MODES.PESSIMISTIC_WRITE,
    );
    question.published = isPublished;

    await this.pgQuestionsRepository.save(question, manager);
  }
}
