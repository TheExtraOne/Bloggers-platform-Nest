import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand extends Command<void> {
  constructor(public id: string) {
    super();
  }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ id }: DeleteUserCommand): Promise<void> {
    const user: UserDocument = await this.usersRepository.findUserById(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
