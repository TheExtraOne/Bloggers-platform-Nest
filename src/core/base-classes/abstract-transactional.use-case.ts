import { DataSource, EntityManager } from 'typeorm';

export abstract class AbstractTransactionalUseCase<CommandT, ResultT> {
  constructor(protected readonly dataSource: DataSource) {}

  async execute(command: CommandT): Promise<ResultT> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        return this.executeInTransaction(command, manager);
      });
    } catch (error) {
      console.error('Failed to process transaction', error);
      throw error;
    }
  }

  protected abstract executeInTransaction(
    command: CommandT,
    manager: EntityManager,
  ): Promise<ResultT>;
}
