import { Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { COMMENTS_CONSTRAINTS } from '../../domain/entities/comment.entity';

export class CreateCommentInputDto {
  @IsStringWithTrim()
  @Length(COMMENTS_CONSTRAINTS.MIN_CONTENT_LENGTH, COMMENTS_CONSTRAINTS.MAX_CONTENT_LENGTH)
  content: string;
}

export class UpdateCommentInputDto {
  @IsStringWithTrim()
  @Length(COMMENTS_CONSTRAINTS.MIN_CONTENT_LENGTH, COMMENTS_CONSTRAINTS.MAX_CONTENT_LENGTH)
  content: string;
}
