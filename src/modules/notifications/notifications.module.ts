import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { SendRegistrationEmailEventHandler } from './events/send-registration-email.event';
import { SendRecoveryEmailEventHandler } from './events/send-recovery-email.event';
import { NotificationConfig } from './notification.config';

@Module({
  imports: [
    CqrsModule,
    MailerModule.forRootAsync({
      imports: [NotificationsModule],
      useFactory: async (notificationConfig: NotificationConfig) => ({
        transport: {
          service: 'Mail.ru',
          auth: {
            user: 'kate_blogs_posts_it_incubator@mail.ru',
            pass: notificationConfig.mailPassword,
          },
        },
        defaults: {
          from: `Blog Platform <kate_blogs_posts_it_incubator@mail.ru>`,
        },
      }),
      inject: [NotificationConfig],
    }),
  ],
  providers: [
    EmailService,
    SendRegistrationEmailEventHandler,
    SendRecoveryEmailEventHandler,
    NotificationConfig,
  ],
  exports: [NotificationConfig],
})
export class NotificationsModule {}
