import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';
import { Questions } from '../../domain/question.entity';
import { AbstractTransactionalUseCase } from '../../../../../core/base-classes/abstract-transactional.use-case';
import { DataSource, EntityManager } from 'typeorm';

export class CreateQuestionCommand extends Command<{ questionId: string }> {
  constructor(public readonly dto: { body: string; correctAnswers: string[] }) {
    super();
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  extends AbstractTransactionalUseCase<
    CreateQuestionCommand,
    { questionId: string }
  >
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(
    private readonly pgQuestionsRepository: PgQuestionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async executeInTransaction(
    command: CreateQuestionCommand,
    manager: EntityManager,
  ) {
    const { body, correctAnswers } = command.dto;

    const newQuestion = new Questions();
    newQuestion.body = body;
    newQuestion.correctAnswers = correctAnswers;

    const savedQuestion = await this.pgQuestionsRepository.save(
      newQuestion,
      manager,
    );

    return { questionId: savedQuestion.id.toString() };
  }
}
