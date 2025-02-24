import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';

export class ConfirmRegistrationInputDto {
  @IsStringWithTrim()
  code: string;
}
