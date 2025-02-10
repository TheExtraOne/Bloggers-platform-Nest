import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { SETTINGS } from './settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);
  app.enableCors();
  await app.listen(SETTINGS.PORT, () => {
    console.log('Server is running on port ' + SETTINGS.PORT);
  });
}

bootstrap();
