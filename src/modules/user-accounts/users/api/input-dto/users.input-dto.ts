import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { ApiProperty } from '@nestjs/swagger';
import { USERS_CONSTRAINTS } from '../../domain/entities/user.entity';

export class CreateUserInputDto {
  @IsStringWithTrim()
  @Length(USERS_CONSTRAINTS.MIN_LOGIN_LENGTH, USERS_CONSTRAINTS.MAX_LOGIN_LENGTH)
  @Matches(/^[a-zA-Z0-9_-]*$/)
  @ApiProperty({
    description: 'Must be unique',
  })
  login: string;

  @IsStringWithTrim()
  @Length(USERS_CONSTRAINTS.MIN_PASSWORD_LENGTH, USERS_CONSTRAINTS.MAX_PASSWORD_LENGTH)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @ApiProperty({
    description: 'Must be unique',
  })
  email: string;
}
