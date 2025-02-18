import { EmailService } from '../../src/features/user-accounts/app/facades/email.service';

export class EmailServiceMock extends EmailService {
  sendRegistrationMail({
    email,
    confirmationCode,
  }: {
    confirmationCode: string;
    email: string;
  }): void {}

  sendRecoveryPasswordMail({
    userEmail,
    recoveryCode,
  }: {
    recoveryCode: string;
    userEmail: string;
  }): void {}
}
