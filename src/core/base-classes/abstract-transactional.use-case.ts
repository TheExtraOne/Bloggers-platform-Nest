import { DataSource, EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

export abstract class AbstractTransactionalUseCase<CommandT, ResultT> {
  protected pendingEvents: { event: any; delay?: number }[] = [];

  constructor(
    protected readonly dataSource: DataSource,
    protected readonly eventEmitter?: EventEmitter2,
  ) {}

  async execute(command: CommandT): Promise<ResultT> {
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        return this.executeInTransaction(command, manager);
      });

      // Emit pending events after transaction is committed
      if (this.eventEmitter && this.pendingEvents.length) {
        for (const pendingEvent of this.pendingEvents) {
          if (pendingEvent.delay) {
            setTimeout(() => {
              this.eventEmitter?.emit(
                pendingEvent.event.constructor.name,
                pendingEvent.event,
              );
            }, pendingEvent.delay);
          } else {
            this.eventEmitter.emit(
              pendingEvent.event.constructor.name,
              pendingEvent.event,
            );
          }
        }
      }

      // Clear pending events
      this.pendingEvents = [];

      return result;
    } catch (error) {
      console.error('Failed to process transaction', error);
      this.pendingEvents = []; // Clear pending events on error
      throw error;
    }
  }

  protected abstract executeInTransaction(
    command: CommandT,
    manager: EntityManager,
  ): Promise<ResultT>;

  protected addPendingEvent(event: any, delay?: number) {
    this.pendingEvents.push({ event, delay });
  }
}
