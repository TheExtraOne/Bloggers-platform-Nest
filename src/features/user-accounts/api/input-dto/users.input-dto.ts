import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserInputDto {
  // TODO: should this check be in pipe or in bll?
  //   @IsUserAlreadyExist({
  //     message: "User $value already exists. Choose another name."
  //  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  login: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @Length(6, 20)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  email: string;
}
