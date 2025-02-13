import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class ResendRegistrationInputDto {
  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  email: string;
}
