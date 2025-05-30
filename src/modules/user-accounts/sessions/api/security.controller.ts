import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtRefreshGuard } from '../../guards/jwt/jwt-refresh.guard';
import { CurrentUserData } from '../../guards/decorators/current-user-data.decorator';
import { PgSessionsViewDto } from './view-dto/sessions.view-dto';
import { GetAllActiveSessionsSwagger } from './swagger/get-all-active-sessions.swagger';
import { DeleteAllSessionsCommand } from '../app/sessions.use-cases/delete-all-sessions.use-case';
import { DeleteAllSessionsSwagger } from './swagger/delete-all-sessions.swagger';
import { DeleteSessionByIdCommand } from '../app/sessions.use-cases/delete-session-by-id.use-case';
import { DeleteSessionByIdSwagger } from './swagger/delete-session-by-id.swagger';
import { GetAllSessionsQuery } from '../app/queries/get-all-sessions.query';

@UseGuards(JwtRefreshGuard)
@Controller(PATHS.SECURITY)
export class SecurityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('devices')
  @GetAllActiveSessionsSwagger.decorator()
  async getAllActiveSessions(
    @CurrentUserData()
    { userId }: { userId: string },
  ): Promise<PgSessionsViewDto[]> {
    return this.queryBus.execute(new GetAllSessionsQuery(userId));
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteAllSessionsSwagger.decorator()
  async terminateAllActiveSessions(
    @CurrentUserData()
    { userId, deviceId }: { userId: string; deviceId: string },
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteAllSessionsCommand(deviceId, userId),
    );
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSessionByIdSwagger.decorator()
  async terminateSessionById(
    @Param('id') id: string,
    @CurrentUserData()
    { userId }: { userId: string },
  ): Promise<void> {
    await this.commandBus.execute(new DeleteSessionByIdCommand(id, userId));
  }
}
