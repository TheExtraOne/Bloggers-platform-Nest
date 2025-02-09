// import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserInputDto {
  // @IsString()
  // @IsNotEmpty()
  // @Length(3, 30)
  login: string;

  // @IsString()
  // @IsNotEmpty()
  // @Length(6, 20)
  password: string;

  // @IsEmail()
  // @IsNotEmpty()
  email: string;
}
