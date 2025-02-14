import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { SETTINGS } from 'src/settings';

// TODO: "@nestjs-modules/mailer"?
@Injectable()
export class EmailService {
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

  sendEmail({
    userEmail,
    subject,
    message,
  }: {
    userEmail: string;
    subject: string;
    message: string;
  }): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transporter = nodemailer.createTransport({
      service: 'Mail.ru',
      auth: {
        user: 'kate_blogs_posts_it_incubator@mail.ru',
        pass: SETTINGS.MAIL_PASSWORD,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    transporter
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .sendMail({
        from: 'Ekaterina <kate_blogs_posts_it_incubator@mail.ru>',
        to: userEmail,
        subject,
        html: message,
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .catch((e: Error) => console.log(e));
  }
}
