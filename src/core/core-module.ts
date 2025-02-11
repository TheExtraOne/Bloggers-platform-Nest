import { Global, Module } from '@nestjs/common';
// import { PaginatedViewDto } from './dto/base.paginated-view.dto';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  // exports: [GlobalLogerService],
  // exports: [PaginatedViewDto],
})
export class CoreModule {}
