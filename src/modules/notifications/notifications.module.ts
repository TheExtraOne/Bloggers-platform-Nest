import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { CoreConfig } from '../../core/config/core.config';
import { SendRegistrationEmailEventHandler } from './events/send-registration-email.event';
import { SendRecoveryEmailEventHandler } from './events/send-recovery-email.event';

@Module({
  imports: [
    CqrsModule,
    // Using forRootAsync for proper environment variables loading
    MailerModule.forRootAsync({
      useFactory: async (coreConfig: CoreConfig) => ({
        transport: {
          service: 'Mail.ru',
          auth: {
            user: 'kate_blogs_posts_it_incubator@mail.ru',
            pass: coreConfig.mailPassword,
          },
        },
        defaults: {
          from: `Blog Platform <kate_blogs_posts_it_incubator@mail.ru>`,
        },
      }),
      inject: [CoreConfig],
    }),
  ],
  providers: [
    EmailService,
    SendRegistrationEmailEventHandler,
    SendRecoveryEmailEventHandler,
  ],
  exports: [],
})
export class NotificationsModule {}
