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
import { LoginUseCases } from '../app/auth.use-cases/login.use-cases';
import { CreateUserUseCase } from '../app/users.use-cases/create-user.use-case';
import { ConfirmEmailRegistrationUseCase } from '../app/auth.use-cases/confirm-email-registration.use-case';
import { ResendRegistrationEmailUseCase } from '../app/auth.use-cases/resend-registration-email.use-case';
import { SendRecoverPasswordEmailUseCase } from '../app/auth.use-cases/send-recover-password-email.use-case';
import { SetNewPasswordUseCase } from '../app/auth.use-cases/set-new-password.use-case';

@UseGuards(ThrottlerGuard)
@Controller(PATHS.AUTH)
export class AuthController {
  constructor(
    private readonly loginUseCases: LoginUseCases,
    private readonly confirmEmailRegistrationUseCase: ConfirmEmailRegistrationUseCase,
    private readonly resendRegistrationEmailUseCase: ResendRegistrationEmailUseCase,
    private readonly sendRecoverPasswordEmailUseCase: SendRecoverPasswordEmailUseCase,
    private readonly setNewPasswordUseCase: SetNewPasswordUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
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
  async login(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } =
      await this.loginUseCases.execute(userId);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async createUser(@Body() dto: CreateUserInputDto): Promise<void> {
    await this.createUserUseCase.execute(dto);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationInputDto,
  ): Promise<void> {
    await this.confirmEmailRegistrationUseCase.execute(dto);
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() dto: ResendRegistrationInputDto,
  ): Promise<void> {
    await this.resendRegistrationEmailUseCase.execute(dto);
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto): Promise<void> {
    await this.sendRecoverPasswordEmailUseCase.execute(dto);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
    await this.setNewPasswordUseCase.execute(dto);
  }
}
