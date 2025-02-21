import { INestApplication } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';

export const validationConstraintSetup = (app: INestApplication) => {
  try {
    // Try to use AppModule first (for production)
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
  } catch {
    // Fallback to using app directly (for tests)
    useContainer(app, { fallbackOnErrors: true });
  }
};
