import { Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class NewPasswordInputDto {
  @IsStringWithTrim()
  @Length(6, 20)
  newPassword: string;

  @IsStringWithTrim()
  recoveryCode: string;
}
