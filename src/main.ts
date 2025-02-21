import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { SETTINGS } from './constants';
import { generateSwaggerStaticFiles } from './setup/swagger.setup';

const serverUrl = `http://localhost:${SETTINGS.PORT}`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);
  await app.listen(SETTINGS.PORT, () => {
    console.log('Server is running on port ' + SETTINGS.PORT);
  });

  await generateSwaggerStaticFiles(serverUrl);
}

bootstrap();
