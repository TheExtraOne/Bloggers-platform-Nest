import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class PasswordRecoveryInputDto {
  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  email: string;
}
