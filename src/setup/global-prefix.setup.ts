import { INestApplication } from '@nestjs/common';
import { SETTINGS } from 'src/settings';

export function globalPrefixSetup(app: INestApplication) {
  app.setGlobalPrefix(SETTINGS.GLOBAL_PREFIX);
}
