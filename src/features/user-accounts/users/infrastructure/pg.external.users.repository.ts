import { Injectable } from '@nestjs/common';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { PgUsersRepository } from './pg.users.repository';

@Injectable()
export class PgExternalUsersRepository extends PgBaseRepository {
  constructor(private readonly pgUsersRepository: PgUsersRepository) {
    super();
  }

  async findUserById(userId: string): Promise<{
    userId: string;
  } | null> {
    return this.pgUsersRepository.findUserById(userId);
  }
}
