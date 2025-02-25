import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PATHS } from '../../../../constants';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { ResendRegistrationInputDto } from './input-dto/resend-registration.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { JwtAuthGuard } from '../../guards/jwt/jwt-auth.guard';
import { LocalAuthGuard } from '../../guards/local/local-auth.guard';
import { CurrentUserId } from '../../guards/decorators/current-user-id.decorator';
import { MeViewDto } from './view-dto/me.view-dto';
import { ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { LoginCommand } from '../app/auth.use-cases/login.use-cases';
import { CreateUserCommand } from '../../users/app/users.use-cases/create-user.use-case';
import { ConfirmEmailRegistrationCommand } from '../app/auth.use-cases/confirm-email-registration.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { JwtRefreshGuard } from '../../guards/jwt/jwt-refresh.guard';
import { CurrentUserData } from '../../guards/decorators/current-user-data.decorator';
import { RefreshTokenCommand } from '../app/auth.use-cases/refresh-token.use-cases';
import { DeleteSessionCommand } from '../../sessions/app/sessions.use-cases/delete-session.use-case';
import { CreateUserInputDto } from '../../users/api/input-dto/users.input-dto';
import { UsersQueryRepository } from '../../users/infrastructure/query/users.query-repository';
import { ResendRegistrationEmailCommand } from '../app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailCommand } from '../app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordCommand } from '../app/auth.use-cases/set-new-password.use-case';
import {
  GetMeSwagger,
  LoginSwagger,
  RefreshTokenSwagger,
  LogoutSwagger,
  RegistrationSwagger,
  RegistrationConfirmationSwagger,
  RegistrationEmailResendingSwagger,
  PasswordRecoverySwagger,
  NewPasswordSwagger,
} from './swagger';

@UseGuards(ThrottlerGuard)
@Controller(PATHS.AUTH)
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @GetMeSwagger()
  async getUserInformation(
    @CurrentUserId() userId: string,
  ): Promise<MeViewDto> {
    const result = await this.usersQueryRepository.findUserById(userId);

    const mappedUser: MeViewDto = {
      email: result.email,
      login: result.login,
      userId: result.id,
    };

    return mappedUser;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @LoginSwagger()
  async login(
    @CurrentUserId() userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    // Data for creating new session
    const title = req.headers['user-agent'] || 'Unknown device';
    const ip = req.socket.remoteAddress || req.ip || '::1';

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginCommand(userId, title, ip),
    );
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @SkipThrottle()
  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @RefreshTokenSwagger()
  async refreshToken(
    @CurrentUserData()
    { userId, deviceId }: { userId: string; deviceId: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new RefreshTokenCommand(userId, deviceId),
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @SkipThrottle()
  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogoutSwagger()
  async logout(
    @CurrentUserData()
    { deviceId, userId }: { deviceId: string; userId: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteSessionCommand(deviceId, userId));
    response.clearCookie('refreshToken');
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RegistrationSwagger()
  async createUser(@Body() dto: CreateUserInputDto): Promise<void> {
    await this.commandBus.execute(new CreateUserCommand(dto));
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RegistrationConfirmationSwagger()
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new ConfirmEmailRegistrationCommand(dto));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RegistrationEmailResendingSwagger()
  async registrationEmailResending(
    @Body() dto: ResendRegistrationInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new ResendRegistrationEmailCommand(dto));
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PasswordRecoverySwagger()
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto): Promise<void> {
    await this.commandBus.execute(new SendRecoverPasswordEmailCommand(dto));
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @NewPasswordSwagger()
  async newPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
    await this.commandBus.execute(new SetNewPasswordCommand(dto));
  }
}
