import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';

export class CreateQuestionCommand extends Command<{ questionId: string }> {
  constructor(public readonly dto: { body: string; correctAnswers: string[] }) {
    super();
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private readonly pgQuestionsRepository: PgQuestionsRepository) {}

  async execute(command: CreateQuestionCommand) {
    const { body, correctAnswers } = command.dto;

    return await this.pgQuestionsRepository.createQuestion({
      body,
      correctAnswers,
    });
  }
}
