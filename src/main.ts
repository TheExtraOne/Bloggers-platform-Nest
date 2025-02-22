import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { generateSwaggerStaticFiles } from './setup/swagger.setup';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);
  const port = coreConfig.port;

  appSetup(app);

  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  await generateSwaggerStaticFiles(`http://localhost:${port}`, app);
}

bootstrap();
