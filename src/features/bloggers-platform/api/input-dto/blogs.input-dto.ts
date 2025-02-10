// import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateBlogInputDto {
  // @IsString()
  // @IsNotEmpty()
  // @Length(3, 30)
  name: string;

  // @IsString()
  // @IsNotEmpty()
  // @Length(6, 20)
  description: string;

  // @IsEmail()
  // @IsNotEmpty()
  websiteUrl: string;
}

export class UpdateBlogInputDto {
  // @IsString()
  // @IsNotEmpty()
  // @Length(3, 30)
  name: string;

  // @IsString()
  // @IsNotEmpty()
  // @Length(6, 20)
  description: string;

  // @IsEmail()
  // @IsNotEmpty()
  websiteUrl: string;
}
