import { Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class CreateCommentInputDto {
  @IsStringWithTrim()
  @Length(20, 300)
  content: string;
}

export class UpdateCommentInputDto {
  @IsStringWithTrim()
  @Length(20, 300)
  content: string;
}
