import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../exception.filter';

// TODO: refactor
export function appSetup(app: INestApplication) {
  pipesSetup(app);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
}
