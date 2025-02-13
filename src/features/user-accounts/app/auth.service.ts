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
import { ResendRegistrationInputDto } from '../api/input-dto/resend-registration.inout-dto';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { EmailService } from './email.service';
import { PasswordRecoveryInputDto } from '../api/input-dto/password-recovery.input-dto';
import { PasswordRecoveryStatus } from '../domain/password-recovery.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
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

  async resendRegistration(dto: ResendRegistrationInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(dto.email);
    // Check if user with such email exists
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    // Check if confirmationCode has already been applied
    if (
      user.emailConfirmation.confirmationStatus ===
      EmailConfirmationStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Update user confirmationCode and expirationDate
    const newConfirmationCode = new ObjectId().toString();
    user.emailConfirmation.confirmationCode = newConfirmationCode;
    user.emailConfirmation.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    await this.usersRepository.save(user);

    // Send confirmation letter
    this.emailService.sendRegistrationMail({
      email: dto.email,
      confirmationCode: newConfirmationCode,
    });
  }

  async recoverPassword(dto: PasswordRecoveryInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(dto.email);
    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = new ObjectId().toString();
    user.passwordRecovery.recoveryCode = newRecoveryCode;
    user.passwordRecovery.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
    user.passwordRecovery.recoveryStatus = PasswordRecoveryStatus.Pending;

    await this.usersRepository.save(user);

    // Send recovery password letter
    this.emailService.sendRecoveryPasswordMail({
      userEmail: dto.email,
      recoveryCode: newRecoveryCode,
    });
  }
}
