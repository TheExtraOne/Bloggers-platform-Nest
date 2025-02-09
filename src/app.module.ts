import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { SETTINGS } from './settings';
import { TestingModule } from './testing/testing.module';

@Module({
  imports: [
    MongooseModule.forRoot(SETTINGS.MONGODB_URI),
    UserAccountsModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
