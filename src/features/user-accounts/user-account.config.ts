import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../core/config-validation.utility';

// Each module has it's own *.config.ts
@Injectable()
export class UserAccountsConfig {
  constructor(private configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }

  @IsNotEmpty({
    message: 'Set Env variable MAIL_PASSWORD, example: your_password',
  })
  mailPassword: string = this.configService.get('MAIL_PASSWORD');

  @IsNotEmpty({
    message: 'Set Env variable JWT_SECRET, example: your_jwt_secret',
  })
  jwtSecret: string = this.configService.get('JWT_SECRET');

  @IsNotEmpty({
    message: 'Set Env variable JWT_EXPIRY, example: 1d',
  })
  jwtExpiry: string = this.configService.get('JWT_EXPIRY');

  @IsNotEmpty({
    message: 'Set Env variable AC_SECRET, example: your_jac_secret',
  })
  acSecret: string = this.configService.get('AC_SECRET');

  @IsNotEmpty({
    message: 'Set Env variable AC_EXPIRY, example: 1m',
  })
  acExpiry: string = this.configService.get('AC_EXPIRY');

  @IsNotEmpty({
    message: 'Set Env variable RT_SECRET, example: your_jrt_secret',
  })
  rtSecret: string = this.configService.get('RT_SECRET');

  @IsNotEmpty({
    message: 'Set Env variable RT_EXPIRY, example: 30m',
  })
  rtExpiry: string = this.configService.get('RT_EXPIRY');

  @IsNotEmpty({ message: 'Set Env variable LOGIN, example: your_login' })
  adminLogin: string = this.configService.get('LOGIN');

  @IsNotEmpty({ message: 'Set Env variable PASSWORD, example: your_password' })
  adminPassword: string = this.configService.get('PASSWORD');
}
