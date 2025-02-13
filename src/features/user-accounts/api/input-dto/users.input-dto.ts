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
  // TODO: move is_string,trim and check for empty to a custom pipe
  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9_-]*$/)
  login: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  @Length(6, 20)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  email: string;
}
