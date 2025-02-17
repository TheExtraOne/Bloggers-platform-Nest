import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { SETTINGS } from './constants';
import { TestingModule } from './testing/testing.module';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core-module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(SETTINGS.MONGODB_URI),
    ThrottlerModule.forRoot([
      {
        ttl: +SETTINGS.TTL,
        limit: +SETTINGS.LIMIT,
      },
    ]),
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
