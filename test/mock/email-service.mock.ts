import { EmailService } from '../../src/modules/user-accounts/utils/email.service';

export class EmailServiceMock extends EmailService {
  // @ts-expect-error
  sendRegistrationMail({
    email,
    confirmationCode,
  }: {
    confirmationCode: string;
    email: string;
  }): void {}
  // @ts-expect-error
  sendRecoveryPasswordMail({
    userEmail,
    recoveryCode,
  }: {
    recoveryCode: string;
    userEmail: string;
  }): void {}
}
