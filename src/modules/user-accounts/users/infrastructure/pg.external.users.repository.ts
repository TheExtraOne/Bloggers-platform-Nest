import { Injectable } from '@nestjs/common';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { PgUsersRepository } from './pg.users.repository';
import { Users } from '../domain/entities/user.entity';

@Injectable()
export class PgExternalUsersRepository extends PgBaseRepository {
  constructor(private readonly pgUsersRepository: PgUsersRepository) {
    super();
  }

  async checkUserExists(userId: string): Promise<boolean> {
    return this.pgUsersRepository.checkUserExists(userId);
  }

  async findUserOrThrow(userId: string): Promise<Users> {
    return this.pgUsersRepository.findUserOrThrow(userId);
  }
}
