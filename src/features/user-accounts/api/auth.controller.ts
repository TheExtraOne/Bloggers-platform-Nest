import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { PATHS } from 'src/settings';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../app/auth.service';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { ResendRegistrationInputDto } from './input-dto/resend-registration.inout-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { LoginInputDto } from './input-dto/login.input-dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/extract.userId-from-request';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';

@Controller(PATHS.AUTH)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getUserInformation(
    @ExtractUserFromRequest() user: { userId: string },
  ): Promise<{
    email: string;
    login: string;
    userId: string;
  }> {
    // TODO: refactor
    const result = await this.usersQueryRepository.findUserById(user.userId);
    const mappedUser = {
      email: result.email,
      login: result.login,
      userId: result.id,
    };
    return mappedUser;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginInputDto): Promise<{ accessToken: string }> {
    return await this.authService.login(dto);
  }

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

  // TODO: add rate limiting
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
    await this.authService.setNewPassword(dto);
  }
}
