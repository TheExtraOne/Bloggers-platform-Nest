import { Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { USERS_CONSTRAINTS } from '../../../../user-accounts/users/domain/entities/user.entity';

export class NewPasswordInputDto {
  @IsStringWithTrim()
  @Length(USERS_CONSTRAINTS.MIN_PASSWORD_LENGTH, USERS_CONSTRAINTS.MAX_PASSWORD_LENGTH)
  newPassword: string;

  @IsStringWithTrim()
  recoveryCode: string;
}
