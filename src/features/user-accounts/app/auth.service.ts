import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';
import { ConfirmRegistrationInputDto } from '../api/input-dto/confirm-registration.input-dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { UserDocument } from '../domain/user.entity';
import { ERRORS } from 'src/settings';
import { EmailConfirmationStatus } from '../domain/email-confirmation.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async createUser(dto: CreateUserInputDto): Promise<string> {
    return await this.userService.createUser(dto);
  }

  async confirmRegistration(dto: ConfirmRegistrationInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByConfirmationCode(dto.code);
    // Check if user with such confirmationCode exist
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    // Check if confirmationCode has already been applied
    if (
      user.emailConfirmation.confirmationStatus ===
      EmailConfirmationStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if confirmationCode expired
    if (user.emailConfirmation.expirationDate < new Date())
      throw new BadRequestException([
        { field: 'code', message: 'already expired' },
      ]);

    // If ok, then updating user flag
    user.emailConfirmation.confirmationStatus =
      EmailConfirmationStatus.Confirmed;
    await this.usersRepository.save(user);
  }
}
