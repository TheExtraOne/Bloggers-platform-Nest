import { EmailService } from '../../src/features/user-accounts/app/email.service';

export class EmailServiceMock extends EmailService {
  sendRegistrationMail({
    email,
    confirmationCode,
  }: {
    confirmationCode: string;
    email: string;
  }): void {
    console.log(
      `Call mock method sendRegistrationMail / EmailServiceMock with params: 
      ${email}, ${confirmationCode}`,
    );
    return;
  }

  sendRecoveryPasswordMail({
    userEmail,
    recoveryCode,
  }: {
    recoveryCode: string;
    userEmail: string;
  }): void {
    console.log(
      `Call mock method sendRecoveryPasswordMail / EmailServiceMock with params: 
      ${userEmail}, ${recoveryCode}`,
    );
    return;
  }
}
