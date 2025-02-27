export class CreateSessionDomainDto {
  deviceId: string;
  ip: string;
  title: string;
  lastActiveDate: Date;
  expirationDate: Date;
  userId: string;
}
