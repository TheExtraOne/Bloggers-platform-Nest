import { configModule } from '../../src/config.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './managers/users-test-manager';
import { deleteAllData } from './delete-all-data';
import { EmailServiceMock } from '../mock/email-service.mock';
import { startMongoMemoryServer } from './mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from '../../src/features/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from '../../src/features/bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../../src/testing/testing.module';
import { CoreModule } from '../../src/core/core-module';
import { PostsTestManager } from './managers/posts-test-manager';
import { BlogsTestManager } from './managers/blogs-test-manager';
import { AuthTestManager } from './managers/auth-test-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import { CommentsTestManager } from './managers/comments-test-manager';
import { EmailService } from '../../src/features/user-accounts/facades/email.service';
import { SessionsTestManager } from './managers/sessions-test-manager';

export class TestSettingsInitializer {
  private readonly defaultTtl = 1000;
  private readonly defaultLimit = 50;

  async init(
    ttl: number = this.defaultTtl,
    limit: number = this.defaultLimit,
    addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
  ) {
    const mongoUri = await startMongoMemoryServer();

    const testingModuleBuilder = Test.createTestingModule({
      imports: [
        configModule,
        MongooseModule.forRoot(mongoUri),
        ThrottlerModule.forRoot([
          {
            ttl,
            limit,
          },
        ]),
        CqrsModule.forRoot(),
        UserAccountsModule,
        BloggersPlatformModule,
        TestingModule,
        CoreModule,
      ],
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
    const usersTestManager = new UsersTestManager(app);
    const postsTestManager = new PostsTestManager(app);
    const blogsTestManager = new BlogsTestManager(app);
    const authTestManager = new AuthTestManager(app);
    const commentsTestManager = new CommentsTestManager(app);
    const emailServiceMock =
      testingAppModule.get<EmailServiceMock>(EmailService);
    const sessionsTestManager = new SessionsTestManager(app);

    await deleteAllData(app);

    return {
      app,
      httpServer,
      usersTestManager,
      postsTestManager,
      blogsTestManager,
      authTestManager,
      commentsTestManager,
      emailServiceMock,
      sessionsTestManager,
    };
  }
}
