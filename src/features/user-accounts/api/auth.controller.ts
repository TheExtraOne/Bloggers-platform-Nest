import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { PATHS } from 'src/settings';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../app/auth.service';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';

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
}
