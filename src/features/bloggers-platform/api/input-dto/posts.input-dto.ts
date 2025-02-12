import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePostInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  blogId: string;
}

export class UpdatePostInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  blogId: string;
}
