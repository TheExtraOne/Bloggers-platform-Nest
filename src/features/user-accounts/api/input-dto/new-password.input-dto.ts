import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  @Length(6, 20)
  newPassword: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  recoveryCode: string;
}
