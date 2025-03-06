import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { MgSessionsRepository } from '../../infrastructure/mg.sessions.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { convertUnixToDate } from '../../../../../core/utils/time.utils';
import { PgSessionsRepository } from '../../infrastructure/pg.sessions.repository';

type TCreateSessionInputDto = {
  exp: number;
  iat: number;
  title?: string;
  ip?: string;
  deviceId: string;
  userId: string;
};

export class CreateSessionCommand extends Command<void> {
  constructor(public readonly dto: TCreateSessionInputDto) {
    super();
  }
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand, void>
{
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
    private readonly mgSessionsRepository: MgSessionsRepository,
    private readonly pgSessionsRepository: PgSessionsRepository,
  ) {}

  async execute(command: CreateSessionCommand): Promise<void> {
    const {
      exp,
      iat,
      title = 'Unknown device',
      ip = '::1',
      deviceId,
      userId,
    } = command.dto;

    // For MongoDB
    // if (!ObjectId.isValid(deviceId)) {
    //   throw new InternalServerErrorException();
    // }

    const newRefreshTokenMeta = {
      // For MongoDB
      // deviceId: new ObjectId(deviceId),
      // For Postgres
      deviceId,
      ip,
      title,
      lastActiveDate: convertUnixToDate(iat),
      expirationDate: convertUnixToDate(exp),
      userId,
    };

    // For MongoDb
    // const session: SessionDocument =
    //   this.SessionModel.createInstance(newRefreshTokenMeta);
    // await this.mgSessionsRepository.save(session);

    // For Postgres
    await this.pgSessionsRepository.createSession(newRefreshTokenMeta);
  }
}
