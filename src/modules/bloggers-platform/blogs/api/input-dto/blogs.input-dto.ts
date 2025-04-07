import { Matches, MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { BLOGS_CONSTRAINTS } from '../../domain/entities/blog.entity';

export class CreateBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_NAME_LENGTH)
  name: string;

  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_DESCRIPTION_LENGTH)
  description: string;

  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_WEBSITE_URL_LENGTH)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}

export class UpdateBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_NAME_LENGTH)
  name: string;

  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_DESCRIPTION_LENGTH)
  description: string;

  @IsStringWithTrim()
  @MaxLength(BLOGS_CONSTRAINTS.MAX_WEBSITE_URL_LENGTH)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}
