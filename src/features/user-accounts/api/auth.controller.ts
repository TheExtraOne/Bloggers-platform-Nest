import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { PATHS } from 'src/settings';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../app/auth.service';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { ResendRegistrationInputDto } from './input-dto/resend-registration.inout-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';

@Controller(PATHS.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // TODO: add rate limiting
  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserInputDto): Promise<void> {
    await this.authService.createUser(dto);
  }

  // TODO: add rate limiting
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationInputDto,
  ): Promise<void> {
    await this.authService.confirmRegistration(dto);
  }

  // TODO: add rate limiting
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() dto: ResendRegistrationInputDto,
  ): Promise<void> {
    await this.authService.resendRegistration(dto);
  }

  // TODO: add rate limiting
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto): Promise<void> {
    await this.authService.recoverPassword(dto);
  }
}
