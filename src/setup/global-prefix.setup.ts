import { INestApplication } from '@nestjs/common';
import { SETTINGS } from '../constants';

export function globalPrefixSetup(app: INestApplication) {
  app.setGlobalPrefix(SETTINGS.GLOBAL_PREFIX);
}
