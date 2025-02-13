import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmRegistrationInputDto {
  @IsString()
  @Transform(({ value }: { value?: string | null }) => value?.trim())
  @IsNotEmpty()
  code: string;
}
