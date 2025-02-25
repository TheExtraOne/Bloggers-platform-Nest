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
    return await this.SessionModel.findOne({ deviceId, deletedAt: null });
  }

  async findAllSessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<SessionDocument[]> {
    return await this.SessionModel.find({ userId, deviceId, deletedAt: null });
  }

  async findSessionByMultipleFilters(
    userId: string,
    deviceId: string,
    lastActiveDate: string,
  ): Promise<SessionDocument | null> {
    return await this.SessionModel.findOne({
      userId,
      deviceId,
      lastActiveDate,
      deletedAt: null,
    });
  }

  async deleteManySessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.SessionModel.updateMany(
      { userId, deviceId: { $ne: deviceId }, deletedAt: null },
      { deletedAt: new Date() },
    );
  }
}
