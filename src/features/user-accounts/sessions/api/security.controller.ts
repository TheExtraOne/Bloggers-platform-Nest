import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { JwtRefreshGuard } from '../../guards/jwt/jwt-refresh.guard';
import { CurrentUserData } from '../../guards/decorators/current-user-data.decorator';
import { SessionsQueryRepository } from '../infrastructure/query/sessions.query-repository';
import { SessionsViewDto } from './view-dto/sessions.view-dto';
import { GetAllActiveSessionsSwagger } from './swagger/get-all-active-sessions.swagger';
import { DeleteAllSessionsCommand } from '../app/sessions.use-cases/delete-all-sessions.use-case';
import { DeleteAllSessionsSwagger } from './swagger/delete-all-sessions.swagger';
import { DeleteSessionByIdCommand } from '../app/sessions.use-cases/delete-session-by-id.use-case';
import { DeleteSessionByIdSwagger } from './swagger/delete-session-by-id.swagger';
import { SessionsRepository } from '../infrastructure/sessions.repository';

@UseGuards(JwtRefreshGuard)
@Controller(PATHS.SECURITY)
export class SecurityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly sessionsQueryRepository: SessionsQueryRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}
  // TODO: refactor
  @Get('devices')
  @GetAllActiveSessionsSwagger.decorator()
  async getAllActiveSessions(
    @CurrentUserData()
    {
      userId,
      deviceId,
      iat,
    }: {
      userId: string;
      deviceId: string;
      iat: number;
    },
  ): Promise<SessionsViewDto[]> {
    // Check that token is valid
    const result =
      await this.sessionsRepository.findAllSessionsByMultipleFilters(
        userId,
        deviceId,
        new Date(iat * 1000).toISOString(),
      );
    if (!result) {
      throw new UnauthorizedException();
    }
    return this.sessionsQueryRepository.findAllSessionsByUserId(userId);
  }
  // TODO: refactor
  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteAllSessionsSwagger.decorator()
  async terminateAllActiveSessions(
    @CurrentUserData()
    {
      userId,
      deviceId,
      iat,
    }: {
      userId: string;
      deviceId: string;
      iat: number;
    },
  ): Promise<void> {
    // Check that token is valid
    const result =
      await this.sessionsRepository.findAllSessionsByMultipleFilters(
        userId,
        deviceId,
        new Date(iat * 1000).toISOString(),
      );
    if (!result) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new DeleteAllSessionsCommand(deviceId, userId),
    );
  }
  // TODO: refactor
  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSessionByIdSwagger.decorator()
  async terminateSessionById(
    @Param('id') id: string,
    @CurrentUserData()
    {
      userId,
      deviceId,
      iat,
    }: { userId: string; deviceId: string; iat: number },
  ): Promise<void> {
    // Check that token is valid
    const result =
      await this.sessionsRepository.findAllSessionsByMultipleFilters(
        userId,
        deviceId,
        new Date(iat * 1000).toISOString(),
      );
    if (!result) {
      throw new UnauthorizedException();
    }
    await this.commandBus.execute(new DeleteSessionByIdCommand(id, userId));
  }
}
