import { ArrayNotEmpty, IsArray, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { QUESTIONS_CONSTRAINTS } from '../../domain/question.entity';

export class UpdateQuestionInputDto {
  @ApiProperty({
    description: 'The text content of the question',
    type: String,
    minLength: QUESTIONS_CONSTRAINTS.MIN_QUESTION_LENGTH,
    maxLength: QUESTIONS_CONSTRAINTS.MAX_QUESTION_LENGTH,
    example: 'What is the capital of France?',
  })
  @IsStringWithTrim()
  @Length(
    QUESTIONS_CONSTRAINTS.MIN_QUESTION_LENGTH,
    QUESTIONS_CONSTRAINTS.MAX_QUESTION_LENGTH,
  )
  body: string;

  @ApiProperty({
    description: 'Array of correct answers for the question',
    type: [String],
    example: ['Paris'],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  correctAnswers: string[];
}
