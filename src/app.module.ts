// Import config module must be on the top
import { configModule } from './config.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { TestingModule } from './testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CoreModule } from './core/core-module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CoreConfig } from './core/config/core.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// TODO: add dynamic inserting of testing module
@Module({
  imports: [
    configModule,
    // TypeOrmModule.forRoot({
    // type: 'postgres',
    // host: 'localhost',
    // port: 5432,
    // username: 'nodejs',
    // password: 'nodejs',
    // database: 'postgres',
    //   autoLoadEntities: false,
    //   synchronize: false,
    // }),
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
    ThrottlerModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return [
          {
            ttl: coreConfig.ttl,
            limit: coreConfig.limit,
          },
        ];
      },
      inject: [CoreConfig],
    }),
    ServeStaticModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return [
          {
            rootPath: join(__dirname, '..', 'swagger-static'),
            serveRoot: coreConfig.showSwagger ? '/swagger' : '/',
          },
        ];
      },
      inject: [CoreConfig],
    }),
    CqrsModule.forRoot(),
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
