import { ApiProperty } from '@nestjs/swagger';
import { AnswerStatus } from '../../domain/answers.entity';

export class AnswerViewDto {
  @ApiProperty({
    description: 'ID of the question that was answered',
    example: '1',
    type: String,
    required: true,
  })
  questionId: string;

  @ApiProperty({
    description: 'Status indicating whether the answer was correct or incorrect',
    enum: AnswerStatus,
    example: AnswerStatus.Correct,
    required: true,
    enumName: 'AnswerStatus',
  })
  answerStatus: AnswerStatus;

  @ApiProperty({
    description: 'ISO timestamp when the answer was submitted',
    example: new Date().toISOString(),
    type: Date,
    required: true,
  })
  addedAt: Date;
}
