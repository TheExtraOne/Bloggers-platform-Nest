import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PgSessionsRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createSession(dto: {
    deviceId: string;
    ip: string;
    title: string;
    lastActiveDate: Date;
    expirationDate: Date;
    userId: string;
  }): Promise<void> {
    if (
      !this.isCorrectNumber(dto.userId) ||
      !this.isCorrectUuid(dto.deviceId)
    ) {
      throw new InternalServerErrorException();
    }

    const query = `
    INSERT INTO public.sessions (id, ip, title, last_activate_date, expiration_date, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
    const params = [
      dto.deviceId,
      dto.ip,
      dto.title,
      dto.lastActiveDate,
      dto.expirationDate,
      dto.userId,
    ];
    await this.dataSource.query(query, params);
  }

  async findSessionByDeviceId(
    deviceId: string,
  ): Promise<{ userId: string } | null> {
    if (!this.isCorrectUuid(deviceId)) {
      return null;
    }

    const query = `
      SELECT user_id
      FROM public.sessions
      WHERE id = $1
      AND deleted_at IS NULL
    `;
    const params = [deviceId];
    const result = await this.dataSource.query(query, params);

    return result[0] ? { userId: result[0].user_id } : null;
  }

  async findSessionByMultipleFilters(
    userId: string,
    deviceId: string,
    lastActiveDate: Date,
  ): Promise<{ id: string } | null> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectUuid(deviceId)) {
      return null;
    }

    const query = `
      SELECT sessions.id
      FROM public.sessions
      WHERE user_id = $1
      AND id = $2
      AND deleted_at IS NULL
      AND last_activate_date = $3
    `;
    const params = [userId, deviceId, lastActiveDate];
    const result = await this.dataSource.query(query, params);

    return result[0] ?? null;
  }

  async updateSessionTime(
    deviceId: string,
    newExp: Date,
    newIat: Date,
  ): Promise<void> {
    if (!this.isCorrectUuid(deviceId)) {
      throw new InternalServerErrorException();
    }
    const query = `
      UPDATE public.sessions
      SET expiration_date = $1, last_activate_date = $2, updated_at = $3
      WHERE id = $4
      AND deleted_at IS NULL
    `;
    const params = [newExp, newIat, new Date(), deviceId];
    await this.dataSource.query(query, params);
  }

  async deleteSessionByDeviceId(deviceId: string): Promise<void> {
    if (!this.isCorrectUuid(deviceId)) {
      throw new InternalServerErrorException();
    }
    const query = `
      UPDATE public.sessions
      SET deleted_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
    `;
    const params = [deviceId];
    await this.dataSource.query(query, params);
  }

  async deleteManySessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectUuid(deviceId)) {
      return;
    }
    // <> is !=
    const query = `
      UPDATE public.sessions
      SET deleted_at = NOW()
      WHERE user_id = $1
      AND id <> $2
      AND deleted_at IS NULL
    `;
    const params = [userId, deviceId];

    await this.dataSource.query(query, params);
  }
}
