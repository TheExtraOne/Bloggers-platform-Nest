import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBlogInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(15)
  name: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}

export class UpdateBlogInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(15)
  name: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(
    /^(http|https):\/\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  )
  websiteUrl: string;
}
