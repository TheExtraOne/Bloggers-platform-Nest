import { SessionDocument } from '../../domain/session.entity';

export class SessionsViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView(user: SessionDocument): SessionsViewDto {
    const dto = new SessionsViewDto();

    dto.ip = user.ip;
    dto.title = user.title;
    dto.lastActiveDate = user.lastActiveDate;
    dto.deviceId = user._id.toString();

    return dto;
  }
}
