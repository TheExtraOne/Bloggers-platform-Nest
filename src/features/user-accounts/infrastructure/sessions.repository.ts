import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async save(session: SessionDocument): Promise<void> {
    await session.save();
  }

  async findSessionByDeviceId(
    deviceId: string,
  ): Promise<SessionDocument | null> {
    return await this.SessionModel.findOne({ deviceId });
  }
}
