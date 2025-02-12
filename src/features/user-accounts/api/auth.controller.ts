import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { PATHS } from 'src/settings';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../app/auth.service';

@Controller(PATHS.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // TODO: add rate limiting
  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserInputDto): Promise<void> {
    await this.authService.createUser(dto);
  }
}
