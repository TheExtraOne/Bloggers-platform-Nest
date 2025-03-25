import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentInputModel {
  @ApiProperty({
    description: 'Content of the comment',
    type: String,
    minLength: 20,
    maxLength: 300,
    example: 'This is a thoughtful comment that meets the minimum length requirement.',
  })
  content: string;
}
