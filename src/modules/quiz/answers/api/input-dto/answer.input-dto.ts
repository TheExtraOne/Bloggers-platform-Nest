import { MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { ANSWERS_CONSTRAINTS } from '../../domain/answers.entity';

export class AnswerInputDto {
  @IsStringWithTrim()
  @MaxLength(ANSWERS_CONSTRAINTS.MAX_ANSWER_LENGTH)
  answer: string;
}
