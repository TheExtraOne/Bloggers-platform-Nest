import { MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { POSTS_CONSTRAINTS } from '../../domain/entities/post.entity';
// import { BlogIdExists } from '../../../decorators/blog-id-exists.decorator';

export class CreatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_TITLE_LENGTH)
  title: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_SHORT_DESCRIPTION_LENGTH)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_CONTENT_LENGTH)
  content: string;

  @IsStringWithTrim()
  // @BlogIdExists()
  blogId: string;
}

export class UpdatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_TITLE_LENGTH)
  title: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_SHORT_DESCRIPTION_LENGTH)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_CONTENT_LENGTH)
  content: string;
}

export class CreatePostFromBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_TITLE_LENGTH)
  title: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_SHORT_DESCRIPTION_LENGTH)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(POSTS_CONSTRAINTS.MAX_CONTENT_LENGTH)
  content: string;
}
