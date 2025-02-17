import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../exception.filter';
import cookieParser from 'cookie-parser';

// TODO: refactor
export function appSetup(app: INestApplication) {
  pipesSetup(app);
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
}
