import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';

@Injectable()
export class PgExternalUsersRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async findUserById(userId: string): Promise<{
    userId: string;
  } | null> {
    if (!this.isCorrectNumber(userId)) {
      return null;
    }

    const result:
      | [
          {
            user_id: string;
          },
        ]
      | [] = await this.dataSource.query(
      `
        SELECT u.id as user_id
        FROM public.users as u
        WHERE u.id = $1 AND u.deleted_at IS NULL;
      `,
      [userId],
    );
    const user = result[0];
    return user
      ? {
          userId: user.user_id,
        }
      : null;
  }
}
