import { Injectable, NotFoundException } from '@nestjs/common';
import { PgSessionsViewDto } from '../../api/view-dto/sessions.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../../constants';
import { Sessions } from '../../domain/entities/session.entity';

@Injectable()
export class PgSessionsQueryRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Sessions)
    private readonly sessionsRepository: Repository<Sessions>,
  ) {
    super();
  }

  async findAllSessionsByUserId(userId: string): Promise<PgSessionsViewDto[]> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }

    const sessions: PgSessionsViewDto[] = await this.sessionsRepository
      .createQueryBuilder('session')
      .select([
        'session.ip AS ip',
        'session.title AS title',
        'session.last_active_date AS "lastActiveDate"',
        'session.id AS "deviceId"',
      ])
      .where('session.user_id = :userId', { userId: userId })
      .orderBy('"lastActiveDate"', 'DESC')
      .getRawMany();

    if (sessions.length === 0) {
      throw new NotFoundException(ERRORS.SESSION_NOT_FOUND);
    }
    return sessions;
  }
}
