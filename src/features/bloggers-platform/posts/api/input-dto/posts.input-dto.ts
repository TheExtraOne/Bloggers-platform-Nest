import { MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { BlogIdExists } from '../../../decorators/blog-id-exists.decorator';

export class CreatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;

  @IsStringWithTrim()
  @BlogIdExists()
  blogId: string;
}

export class UpdatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;

  @IsStringWithTrim()
  @BlogIdExists()
  blogId: string;
}

export class CreatePostFromBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;
}
