import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';

export class DeleteUserCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly pgUsersRepository: PgUsersRepository) {}

  async execute({ id }: DeleteUserCommand): Promise<void> {
    await this.pgUsersRepository.deleteUserById(id);
  }
}
