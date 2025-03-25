import { TPgSession } from '../../infrastructure/query/pg.sessions.query-repository';

export class PgSessionsViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView(session: TPgSession): PgSessionsViewDto {
    const dto = new PgSessionsViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.last_activate_date;
    dto.deviceId = session.id.toString();

    return dto;
  }
}
