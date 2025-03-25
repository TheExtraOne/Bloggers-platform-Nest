import { Matches, MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class CreateBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(15)
  name: string;

  @IsStringWithTrim()
  @MaxLength(500)
  description: string;

  @IsStringWithTrim()
  @MaxLength(100)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}

export class UpdateBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(15)
  name: string;

  @IsStringWithTrim()
  @MaxLength(500)
  description: string;

  @IsStringWithTrim()
  @MaxLength(100)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}
