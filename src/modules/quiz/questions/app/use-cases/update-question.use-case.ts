import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgQuestionsRepository } from '../../infrastructure/pg.questions.repository';
import { UpdateQuestionInputDto } from '../../api/input-dto/update-question.input-dto';

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
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly pgQuestionsRepository: PgQuestionsRepository) {}

  async execute(command: UpdateQuestionCommand) {
    const { id, updateQuestionDto } = command.dto;
    await this.pgQuestionsRepository.updateQuestion(id, updateQuestionDto);
  }
}
