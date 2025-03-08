// import { MgUsersRepository } from '../../infrastructure/mg.users.repository';
// import { UserDocument } from '../../domain/user.entity';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';

export class DeleteUserCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(
    // private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
  ) {}

  async execute({ id }: DeleteUserCommand): Promise<void> {
    // For MongoDB
    // const user: UserDocument = await this.mgUsersRepository.findUserById(id);
    // user.makeDeleted();
    // await this.mgUsersRepository.save(user);

    // For Postgres
    await this.pgUsersRepository.deleteUserById(id);
  }
}
