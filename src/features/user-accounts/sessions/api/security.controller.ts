import { Controller, Get, UseGuards } from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { JwtRefreshGuard } from '../../guards/jwt/jwt-refresh.guard';
import { CurrentUserDeviceIdAndUserId } from '../../guards/decorators/current-user-device-id-and-id.decorator';
import { SessionsQueryRepository } from '../infrastructure/query/sessions.query-repository';
import { SessionsViewDto } from './view-dto/sessions.view-dto';
import { GetAllActiveSessionsSwagger } from './swagger/get-all-active-sessions.swagger';

@UseGuards(JwtRefreshGuard)
@Controller(PATHS.SECURITY)
export class SecurityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  // TODO: add swagger
  @Get('devices')
  @GetAllActiveSessionsSwagger.decorator()
  async getAllActiveSessions(
    @CurrentUserDeviceIdAndUserId()
    { userId, deviceId }: { userId: string; deviceId: string },
  ): Promise<SessionsViewDto[]> {
    return this.sessionsQueryRepository.findAllSessionsByUserAndDeviceId(
      userId,
      deviceId,
    );
  }

  // @SkipThrottle()
  // @Post('logout')
  // @UseGuards(JwtRefreshGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @LogoutSwagger()
  // async logout(
  //   @CurrentUserDeviceIdAndUserId()
  //   { userId, deviceId }: { userId: string; deviceId: string },
  //   @Res({ passthrough: true }) response: Response,
  // ): Promise<void> {
  //   await this.commandBus.execute(new DeleteSessionCommand(deviceId));
  //   response.clearCookie('refreshToken');
  // }
}
