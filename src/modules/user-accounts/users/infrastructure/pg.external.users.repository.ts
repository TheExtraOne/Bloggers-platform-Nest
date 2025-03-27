import { Injectable } from '@nestjs/common';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { PgUsersRepository } from './pg.users.repository';
import { Users } from '../domain/entities/user.entity';

@Injectable()
export class PgExternalUsersRepository extends PgBaseRepository {
  constructor(private readonly pgUsersRepository: PgUsersRepository) {
    super();
  }

  async findUserById(userId: string): Promise<Users | null> {
    return this.pgUsersRepository.findUserById(userId);
  }
}
