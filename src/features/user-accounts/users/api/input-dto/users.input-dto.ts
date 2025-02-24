import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { ApiProperty } from '@nestjs/swagger';
import { UsersSortBy } from './users-sort-by';

export class CreateUserInputDto {
  @IsStringWithTrim()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9_-]*$/)
  @ApiProperty({
    description: 'Must be unique',
  })
  login: string;

  @IsStringWithTrim()
  @Length(6, 20)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @ApiProperty({
    description: 'Must be unique',
  })
  email: string;
}
