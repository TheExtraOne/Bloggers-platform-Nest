import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../domain/session.entity';
import {
  MgSessionsViewDto,
  PgSessionsViewDto,
} from '../../api/view-dto/sessions.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
export class PgSessionsQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAllSessionsByUserId(userId: string): Promise<PgSessionsViewDto[]> {
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

    return result.map(PgSessionsViewDto.mapToView);
  }
}
