import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../domain/session.entity';
import { SessionsViewDto } from '../../api/view-dto/sessions.view-dto';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async findAllSessionsByUserId(userId: string): Promise<SessionsViewDto[]> {
    const result = await this.SessionModel.find({
      userId,
      deletedAt: null,
    }).lean();

    return result.map(SessionsViewDto.mapToView);
  }
}
