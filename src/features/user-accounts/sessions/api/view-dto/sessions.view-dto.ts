import { SessionDocument } from '../../domain/session.entity';
import { TPgSession } from '../../infrastructure/query/pg.sessions.query-repository';

export class MgSessionsViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView(session: SessionDocument): MgSessionsViewDto {
    const dto = new MgSessionsViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.lastActiveDate;
    dto.deviceId = session._id.toString();

    return dto;
  }
}

export class PgSessionsViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView(session: TPgSession): MgSessionsViewDto {
    const dto = new MgSessionsViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.last_activate_date;
    dto.deviceId = session.id.toString();

    return dto;
  }
}
