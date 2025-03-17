import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from './config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

// Each module has it's own *.config.ts
@Injectable()
export class CoreConfig {
  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }

  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable MONGODB_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongodbUri: string = this.configService.get('MONGODB_URI');

  @IsNotEmpty({
    message: 'Set Env variable NODE_ENV, example: development',
  })
  @IsEnum(Environments, {
    message:
      'Invalid NODE_ENV, possible values are: development, staging, production, testing',
  })
  env: string = this.configService.get('NODE_ENV');

  @IsBoolean({
    message: 'Set Env variable SHOW_SWAGGER, example: true',
  })
  showSwagger: boolean = configValidationUtility.convertStringToBoolean(
    this.configService.get('SHOW_SWAGGER'),
  ) as boolean;

  @IsNumber(
    {},
    {
      message: 'Set Env variable TTL, example: 10000',
    },
  )
  ttl: number = Number(this.configService.get('TTL'));

  @IsNumber(
    {},
    {
      message: 'Set Env variable LIMIT, example: 5',
    },
  )
  limit: number = Number(this.configService.get('LIMIT'));
}
