import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';

@Global()
@Module({
  exports: [CoreConfig],
  providers: [CoreConfig],
})
export class CoreModule {}
