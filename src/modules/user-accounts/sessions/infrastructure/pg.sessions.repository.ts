import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { DataSource, Repository } from 'typeorm';
import { Sessions } from '../domain/entities/session.entity';
import { PgExternalUsersRepository } from '../../users/infrastructure/pg.external.users.repository';
import { Users } from '../../users/domain/entities/user.entity';

@Injectable()
export class PgSessionsRepository extends PgBaseRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Sessions)
    private readonly sessionsRepository: Repository<Sessions>,
    private readonly pgExternalUsersRepository: PgExternalUsersRepository,
  ) {
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
    const { userId, deviceId, ip, title, lastActiveDate, expirationDate } = dto;

    if (!this.isCorrectNumber(userId) || !this.isCorrectUuid(deviceId)) {
      throw new InternalServerErrorException();
    }

    const user: Users | null =
      await this.pgExternalUsersRepository.findUserById(userId);

    const session = new Sessions();
    session.id = deviceId;
    session.ip = ip;
    session.title = title;
    session.lastActiveDate = lastActiveDate;
    session.expirationDate = expirationDate;
    session.user = user as Users;

    await this.sessionsRepository.save(session);
  }
  // TODO
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
  ): Promise<Sessions | null> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectUuid(deviceId)) {
      return null;
    }

    return await this.sessionsRepository.findOne({
      where: { id: deviceId, user: { id: +userId }, lastActiveDate },
    });
  }

  async updateSessionTime(
    deviceId: string,
    newExp: Date,
    newIat: Date,
  ): Promise<void> {
    if (!this.isCorrectUuid(deviceId)) {
      throw new InternalServerErrorException();
    }

    const session = await this.sessionsRepository.findOne({
      where: { id: deviceId },
    });

    if (!session) {
      throw new InternalServerErrorException();
    }

    session.expirationDate = newExp;
    session.lastActiveDate = newIat;

    await this.sessionsRepository.save(session);
  }

  async deleteSessionByDeviceId(deviceId: string): Promise<void> {
    if (!this.isCorrectUuid(deviceId)) {
      throw new InternalServerErrorException();
    }

    await this.sessionsRepository.softDelete({ id: deviceId });
  }
  // TODO
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
