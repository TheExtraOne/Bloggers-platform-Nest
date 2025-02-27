import { ObjectId } from 'mongodb';

export class CreateSessionDomainDto {
  deviceId: ObjectId;
  ip: string;
  title: string;
  lastActiveDate: Date;
  expirationDate: Date;
  userId: string;
}
