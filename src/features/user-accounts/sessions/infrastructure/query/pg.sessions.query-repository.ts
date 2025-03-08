import { Injectable, NotFoundException } from '@nestjs/common';
import { PgSessionsViewDto } from '../../api/view-dto/sessions.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from 'src/constants';

export type TPgSession = {
  id: string;
  ip: string;
  title: string;
  user_id: string;
  last_activate_date: Date;
  expiration_date: Date;
  deleted_at: Date | null;
  updated_at: Date;
};

@Injectable()
export class PgSessionsQueryRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async findAllSessionsByUserId(userId: string): Promise<PgSessionsViewDto[]> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    const result = await this.dataSource.query(
      `
        SELECT *
        FROM public.sessions
        WHERE user_id = $1
        AND deleted_at IS NULL
        ORDER BY last_activate_date DESC
      `,
      [userId],
    );
    if (result.length === 0) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    return result.map(PgSessionsViewDto.mapToView);
  }
}
