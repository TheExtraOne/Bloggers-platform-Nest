import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';

export class PublishQuestionCommand extends Command<void> {
  constructor(public readonly dto: { id: string; isPublished: boolean }) {
    super();
  }
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand>
{
  constructor(private readonly pgQuestionsRepository: PgQuestionsRepository) {}

  async execute(command: PublishQuestionCommand) {
    const { id, isPublished } = command.dto;

    await this.pgQuestionsRepository.publishQuestion(id, isPublished);
  }
}
