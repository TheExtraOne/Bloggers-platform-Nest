import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../exception.filter';
import cookieParser from 'cookie-parser';
import { validationConstraintSetup } from './validation-constrain.setup';
import { swaggerSetup } from './swagger.setup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  validationConstraintSetup(app);
  swaggerSetup(app);
}
