import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';

// TODO: add command handler
@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(id: string): Promise<void> {
    const user: UserDocument = await this.usersRepository.findUserById(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
