import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PATHS } from '../../../constants';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { ResendRegistrationInputDto } from './input-dto/resend-registration.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { JwtAuthGuard } from '../guards/jwt/jwt-auth.guard';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { CurrentUserId } from '../guards/decorators/current-user-id.decorator';
import { MeViewDto } from './view-dto/me.view-dto';
import { ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { LoginCommand } from '../app/auth.use-cases/login.use-cases';
import { CreateUserCommand } from '../app/users.use-cases/create-user.use-case';
import { ConfirmEmailRegistrationCommand } from '../app/auth.use-cases/confirm-email-registration.use-case';
import { ResendRegistrationEmailCommand } from '../app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailCommand } from '../app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordCommand } from '../app/auth.use-cases/set-new-password.use-case';
import { CommandBus } from '@nestjs/cqrs';
import {
  GetMeSwagger,
  LoginSwagger,
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

  @SkipThrottle()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @LoginSwagger()
  async login(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginCommand(userId),
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
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
