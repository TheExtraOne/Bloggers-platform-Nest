import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';
import { ObjectId } from 'mongodb';

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
    if (!ObjectId.isValid(deviceId)) {
      return null;
    }
    return await this.SessionModel.findOne({
      _id: new ObjectId(deviceId),
      deletedAt: null,
    });
  }

  async findAllSessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<SessionDocument[]> {
    if (!ObjectId.isValid(deviceId)) {
      return [];
    }
    return await this.SessionModel.find({
      userId,
      _id: new ObjectId(deviceId),
      deletedAt: null,
    });
  }

  async findSessionByMultipleFilters(
    userId: string,
    deviceId: string,
    lastActiveDate: Date,
  ): Promise<SessionDocument | null> {
    if (!ObjectId.isValid(deviceId)) {
      return null;
    }
    return await this.SessionModel.findOne({
      userId,
      _id: new ObjectId(deviceId),
      lastActiveDate,
      deletedAt: null,
    });
  }

  async deleteManySessionsByUserAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    if (!ObjectId.isValid(deviceId)) {
      return;
    }
    await this.SessionModel.updateMany(
      { userId, _id: { $ne: new ObjectId(deviceId) }, deletedAt: null },
      { deletedAt: new Date() },
    );
  }
}
