import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import { NewPasswordInputDto } from '../api/input-dto/new-password.input-dto';
import { BcryptService } from './bcrypt.service';
import { LoginInputDto } from '../api/input-dto/login.input-dto';
import { JwtService, TOKEN_TYPE } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginInputDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepository.findUserByLoginOrEmail(
      dto.loginOrEmail,
    );
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
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordCorrect) throw new UnauthorizedException();

    const userId = user._id.toString();
    // const deviceId = new ObjectId();
    const accessToken: string = this.jwtService.createToken({
      payload: { userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    // const refreshToken: string = await this.jwtService.createToken({
    //   payload: { userId, deviceId: deviceId.toString() },
    //   type: TOKEN_TYPE.R_TOKEN,
    // });

    // await this.securityService.createRefreshTokenMeta({
    //   refreshToken,
    //   title: req.headers['user-agent'] || 'Unknown device',
    //   ip: req.ip || '::1',
    //   deviceId,
    // });

    // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    return { accessToken };
  }

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
        { field: 'email', message: 'already confirmed' },
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

  async setNewPassword(dto: NewPasswordInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByPasswordRecoveryCode(
        dto.recoveryCode,
      );
    // Check if user with such recoveryCode exist
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    // Check if recoveryCode has already been applied
    if (
      user.passwordRecovery.recoveryStatus === PasswordRecoveryStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if recoveryCode expired
    if (
      user.passwordRecovery.expirationDate &&
      user.passwordRecovery.expirationDate < new Date()
    )
      throw new BadRequestException([
        { field: 'code', message: 'already expired' },
      ]);

    // If ok, then updating user password
    const passwordHash = await this.bcryptService.hashPassword(
      dto.newPassword,
      10,
    );
    user.passwordHash = passwordHash;
    user.passwordRecovery.recoveryStatus = PasswordRecoveryStatus.Confirmed;
    user.passwordRecovery.recoveryCode = null;
    user.passwordRecovery.expirationDate = null;

    await this.usersRepository.save(user);
  }
}
