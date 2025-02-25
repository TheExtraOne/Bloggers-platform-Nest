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

    const newRefreshTokenMeta = {
      deviceId: deviceId ?? new ObjectId().toString(),
      ip,
      title,
      lastActiveDate: this.timeService.convertUnixToISOString(iat),
      expirationDate: this.timeService.convertUnixToISOString(exp),
      userId: userId,
    };

    const session: SessionDocument =
      await this.SessionModel.create(newRefreshTokenMeta);
    await this.sessionsRepository.save(session);
  }
}
