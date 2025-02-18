import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { EmailConfirmationStatus } from '../domain/email-confirmation.schema';
import { BcryptService } from './facades/bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async checkIfUserIsAbleToLogin(
    loginOrEmail: string,
    password: string,
  ): Promise<string> {
    const user =
      await this.usersRepository.findUserByLoginOrEmail(loginOrEmail);
    // Check that such user exists
    if (!user) throw new UnauthorizedException();

    // Check that user confirmed his email
    if (
      user.emailConfirmation.confirmationStatus !==
      EmailConfirmationStatus.Confirmed
    )
      throw new UnauthorizedException();

    // Check that user password is correct
    const isPasswordCorrect = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isPasswordCorrect) throw new UnauthorizedException();

    return user._id.toString();
  }
}
