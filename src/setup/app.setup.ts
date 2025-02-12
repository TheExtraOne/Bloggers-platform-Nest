import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
// import { globalPrefixSetup } from './global-prefix.setup';
import { swaggerSetup } from './swagger.setup';
import { HttpExceptionFilter } from 'src/exception.filter';

// TODO: refactor
export function appSetup(app: INestApplication) {
  pipesSetup(app);
  // globalPrefixSetup(app);
  swaggerSetup(app);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
}
