import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ObjectId } from 'mongodb';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { TimeService } from '../../../../../core/services/time.service';
import { InternalServerErrorException } from '@nestjs/common';

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
    private readonly sessionsRepository: SessionsRepository,
    private readonly timeService: TimeService,
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
    if (!ObjectId.isValid(deviceId)) {
      throw new InternalServerErrorException();
    }
    const newRefreshTokenMeta = {
      deviceId: new ObjectId(deviceId),
      ip,
      title,
      lastActiveDate: this.timeService.convertUnixToDate(iat),
      expirationDate: this.timeService.convertUnixToDate(exp),
      userId: userId,
    };

    const session: SessionDocument =
      this.SessionModel.createInstance(newRefreshTokenMeta);
    await this.sessionsRepository.save(session);
  }
}
