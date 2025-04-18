import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';

export class DeleteQuestionCommand extends Command<void> {
  constructor(public readonly questionId: string) {
    super();
  }
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private readonly pgQuestionsRepository: PgQuestionsRepository) {}

  async execute(command: DeleteQuestionCommand) {
    const { questionId } = command;

    return await this.pgQuestionsRepository.deleteQuestion(questionId);
  }
}
