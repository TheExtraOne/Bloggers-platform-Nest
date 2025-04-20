import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../core/config/config-validation.utility';

// Each module has it's own *.config.ts
@Injectable()
export class NotificationConfig {
  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }

  @IsNotEmpty({
    message: 'Set Env variable MAIL_PASSWORD, example: your_password',
  })
  mailPassword: string = this.configService.get('MAIL_PASSWORD');
}
