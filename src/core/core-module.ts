import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';
import { TimeService } from './services/time.service';

@Global()
@Module({
  exports: [CoreConfig, TimeService],
  providers: [CoreConfig, TimeService],
})
export class CoreModule {}
