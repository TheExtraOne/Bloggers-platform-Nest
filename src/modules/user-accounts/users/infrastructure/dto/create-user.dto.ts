import { EmailConfirmationStatus } from '../../domain/enums/user.enums';

export class CreateUserDto {
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode: string | null;
  expirationDate: Date | null;
  confirmationStatus: EmailConfirmationStatus;
}
