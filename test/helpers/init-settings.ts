import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './managers/users-test-manager';
import { deleteAllData } from './delete-all-data';
import { EmailService } from '../../src/features/user-accounts/app/facades/email.service';
import { EmailServiceMock } from '../mock/email-service.mock';
import { startMongoMemoryServer } from './mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserAccountsModule } from '../../src/features/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from '../../src/features/bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../../src/testing/testing.module';
import { CoreModule } from '../../src/core/core-module';
import { PostsTestManager } from './managers/posts-test-manager';
import { BlogsTestManager } from './managers/blogs-test-manager';
import { AuthTestManager } from './managers/auth-test-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';

export const initSettings = async (
  ttl: number = 1000,
  limit: number = 50,
  // Passing a callback which will be received by the module builder, if we want to change the settings of the test module
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const mongoUri = await startMongoMemoryServer();

  const testingModuleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(),
      MongooseModule.forRoot(mongoUri),
      ThrottlerModule.forRoot([
        {
          ttl, // 1 second for tests
          limit, // Lower limit to test rate limiting
        },
      ]),
      CqrsModule.forRoot(),
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
  const postsTestManager = new PostsTestManager(app);
  const blogsTestManager = new BlogsTestManager(app);
  const authTestManager = new AuthTestManager(app);
  const emailServiceMock = testingAppModule.get<EmailServiceMock>(EmailService);

  await deleteAllData(app);

  return {
    app,
    httpServer,
    userTestManger,
    postsTestManager,
    blogsTestManager,
    authTestManager,
    emailServiceMock,
  };
};
