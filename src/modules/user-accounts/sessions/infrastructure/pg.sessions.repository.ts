import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { Not, Repository } from 'typeorm';
import { Sessions } from '../domain/entities/session.entity';
import { PgExternalUsersRepository } from '../../users/infrastructure/pg.external.users.repository';
import { Users } from '../../users/domain/entities/user.entity';
import { ERRORS } from '../../../../constants';

@Injectable()
export class PgSessionsRepository extends PgBaseRepository {
  constructor(
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

  async findSessionByDeviceId(deviceId: string): Promise<Sessions | null> {
    if (!this.isCorrectUuid(deviceId)) {
      return null;
    }

    return this.sessionsRepository.findOne({
      where: { id: deviceId },
      relations: ['user'],
    });
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
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }

    await this.sessionsRepository.softDelete({ id: deviceId });
  }

  async deleteManySessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    if (!this.isCorrectNumber(userId) || !this.isCorrectUuid(deviceId)) {
      return;
    }

    await this.sessionsRepository.softDelete({
      user: { id: +userId },
      id: Not(deviceId),
    });
  }
}
