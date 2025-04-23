import { configModule } from '../../src/config.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './managers/users-test-manager';
import { deleteAllData } from './delete-all-data';
import { EmailServiceMock } from '../mock/email-service.mock';
import { UserAccountsModule } from '../../src/modules/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from '../../src/modules/bloggers-platform/bloggers-platform.module';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module';
import { TestingModule } from '../../src/testing/testing.module';
import { CoreModule } from '../../src/core/core-module';
import { PostsTestManager } from './managers/posts-test-manager';
import { BlogsTestManager } from './managers/blogs-test-manager';
import { AuthTestManager } from './managers/auth-test-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import { CommentsTestManager } from './managers/comments-test-manager';
import { EmailService } from '../../src/modules/notifications/email.service';
import { SessionsTestManager } from './managers/sessions-test-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CoreConfig } from '../../src/core/config/core.config';
import { QuizModule } from '../../src/modules/quiz/quiz.module';
import { QuestionsTestManager } from './managers/questions-test-manager';
import { PairGamesTestManager } from './managers/pair-games-test-manager';

export class TestSettingsInitializer {
  private readonly defaultTtl = 1000;
  private readonly defaultLimit = 50;

  async init(
    ttl: number = this.defaultTtl,
    limit: number = this.defaultLimit,
    addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
  ) {
    const testingModuleBuilder = Test.createTestingModule({
      imports: [
        configModule,
        ThrottlerModule.forRoot([
          {
            ttl,
            limit,
          },
        ]),
        CqrsModule.forRoot(),
        TypeOrmModule.forRootAsync({
          useFactory: (coreConfig: CoreConfig) => {
            return {
              type: 'postgres',
              url: coreConfig.postgresUri,
              namingStrategy: new SnakeNamingStrategy(),
              autoLoadEntities: true,
              synchronize: true,
            };
          },
          inject: [CoreConfig],
        }),
        UserAccountsModule,
        BloggersPlatformModule,
        TestingModule,
        CoreModule,
        NotificationsModule,
        QuizModule,
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
    const questionsTestManager = new QuestionsTestManager(app);
    const pairGamesTestManager = new PairGamesTestManager(app);

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
      questionsTestManager,
      pairGamesTestManager,
    };
  }
}
