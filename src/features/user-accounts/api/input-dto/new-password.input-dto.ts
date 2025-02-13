import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  @Length(6, 20)
  newPassword: string;

  @IsString()
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty()
  recoveryCode: string;
}
