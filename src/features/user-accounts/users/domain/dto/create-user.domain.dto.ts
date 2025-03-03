import { EmailConfirmationStatus } from '../email-confirmation.schema';

export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode: string | null;
  expirationDate: Date | null;
  confirmationStatus: EmailConfirmationStatus;
}
