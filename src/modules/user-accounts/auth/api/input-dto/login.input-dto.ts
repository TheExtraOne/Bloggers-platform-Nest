import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class LoginInputDto {
  @IsStringWithTrim()
  loginOrEmail: string;

  @IsStringWithTrim()
  password: string;
}
