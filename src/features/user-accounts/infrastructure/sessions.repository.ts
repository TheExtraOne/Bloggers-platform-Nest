import { Injectable } from '@nestjs/common';
import { SessionDocument } from '../domain/session.entity';

@Injectable()
export class SessionsRepository {
  async save(session: SessionDocument): Promise<void> {
    await session.save();
  }
}
