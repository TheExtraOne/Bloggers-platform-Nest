import { Sessions } from '../../domain/entities/session.entity';

export class PgSessionsViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView(session: Sessions): PgSessionsViewDto {
    const dto = new PgSessionsViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.lastActiveDate;
    dto.deviceId = session.id.toString();

    return dto;
  }
}
