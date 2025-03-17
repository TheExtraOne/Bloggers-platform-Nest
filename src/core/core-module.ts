import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './config/core.config';
import { PgBaseRepository } from './base-classes/pg.base.repository';

@Global()
@Module({
  exports: [CoreConfig, PgBaseRepository],
  providers: [CoreConfig, PgBaseRepository],
})
export class CoreModule {}
