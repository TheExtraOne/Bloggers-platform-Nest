import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishQuestionInputDto {
  @ApiProperty({
    description: 'The status of the question',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  published: boolean;
}
