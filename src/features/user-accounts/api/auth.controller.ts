import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Request,
} from '@nestjs/common';
import { PATHS } from 'src/settings';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../app/auth.service';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { ResendRegistrationInputDto } from './input-dto/resend-registration.inout-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';

@Controller(PATHS.AUTH)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getUserInformation(
    @Request() req: { user: { userId: string } },
  ): Promise<{
    email: string;
    login: string;
    userId: string;
  }> {
    const { userId } = req.user;
    const result = await this.usersQueryRepository.findUserById(userId);
    // TODO: refactor
    const mappedUser = {
      email: result.email,
      login: result.login,
      userId: result.id,
    };
    return mappedUser;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: { userId: string } }) {
    return await this.authService.login(req.user.userId);
  }

  // TODO: add rate limiting
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
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
