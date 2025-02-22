// Import config module must be on the top
import { configModule } from './config.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { SETTINGS } from './constants';
import { TestingModule } from './testing/testing.module';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module';
import { CoreModule } from './core/core-module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    configModule,
    MongooseModule.forRoot(SETTINGS.MONGODB_URI),
    ThrottlerModule.forRoot([
      {
        ttl: +SETTINGS.TTL,
        limit: +SETTINGS.LIMIT,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: process.env.SHOW_SWAGGER ? '/swagger' : '/',
    }),
    CqrsModule.forRoot(),
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
