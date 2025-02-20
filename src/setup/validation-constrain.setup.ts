import { INestApplication } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';

export const validationConstraintSetup = (app: INestApplication) => {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
};
