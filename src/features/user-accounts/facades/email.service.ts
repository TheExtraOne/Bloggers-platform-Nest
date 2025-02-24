import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { UserAccountsConfig } from '../user-account.config';
// TODO: "@nestjs-modules/mailer"?
@Injectable()
export class EmailService {
  constructor(private readonly userAccountsConfig: UserAccountsConfig) {}

  sendRegistrationMail({
    email,
    confirmationCode,
  }: {
    confirmationCode: string;
    email: string;
  }): void {
    this.sendEmail({
      userEmail: email,
      subject: 'Blogs&Posts platform',
      message: `<h1>Thank for your registration</h1>
                        <p>To finish registration please follow the link below:
                          <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>
                        </p>
                        <p>Or use the link below:
                          <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>https://somesite.com/confirm-email?code=${confirmationCode}</a>
                        </p>`,
    });
  }

  sendRecoveryPasswordMail({
    userEmail,
    recoveryCode,
  }: {
    recoveryCode: string;
    userEmail: string;
  }): void {
    this.sendEmail({
      userEmail,
      subject: 'Blogs&Posts platform',
      message: `<h1>Password recovery</h1>
                    <p>To recover your password please follow the link below:
                       <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
                    </p>
                    <p>Or use the link below:
                      <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>https://somesite.com/password-recovery?recoveryCode=${recoveryCode}</a>
                    </p>`,
    });
  }

  private sendEmail({
    userEmail,
    subject,
    message,
  }: {
    userEmail: string;
    subject: string;
    message: string;
  }): void {
    const transporter = nodemailer.createTransport({
      service: 'Mail.ru',
      auth: {
        user: 'kate_blogs_posts_it_incubator@mail.ru',
        pass: this.userAccountsConfig.mailPassword,
      },
    });

    transporter
      .sendMail({
        from: 'Ekaterina <kate_blogs_posts_it_incubator@mail.ru>',
        to: userEmail,
        subject,
        html: message,
      })
      .catch((e: Error) => console.log(e));
  }
}
