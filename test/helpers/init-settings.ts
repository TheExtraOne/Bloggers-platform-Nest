import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './managers/users-test-manager';
import { deleteAllData } from './delete-all-data';
import { EmailService } from '../../src/features/user-accounts/app/email.service';
import { EmailServiceMock } from '../mock/email-service.mock';
import { startMongoMemoryServer } from './mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserAccountsModule } from '../../src/features/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from '../../src/features/bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../../src/testing/testing.module';
import { CoreModule } from '../../src/core/core-module';

export const initSettings = async (
  // Passing a callback which will be received by the module builder, if we want to change the settings of the test module
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const mongoUri = await startMongoMemoryServer();

  const testingModuleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(),
      MongooseModule.forRoot(mongoUri),
      UserAccountsModule,
      BloggersPlatformModule,
      TestingModule,
      CoreModule,
    ],
    // imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useClass(EmailServiceMock);

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();
  const app = testingAppModule.createNestApplication();

  appSetup(app);
  await app.init();

  const httpServer = app.getHttpServer();
  const userTestManger = new UsersTestManager(app);

  await deleteAllData(app);

  return {
    app,
    httpServer,
    userTestManger,
  };
};
