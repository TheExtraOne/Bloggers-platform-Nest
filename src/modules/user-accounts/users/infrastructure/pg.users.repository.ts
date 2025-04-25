import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERRORS } from '../../../../constants';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import {
  EmailConfirmationStatus,
  PasswordRecoveryStatus,
} from '../domain/enums/user.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { Users } from '../domain/entities/user.entity';
import { UsersEmailConfirmation } from '../domain/entities/email.confirmation.entity';
import { UsersPasswordRecovery } from '../domain/entities/password.recovery.entity';

@Injectable()
export class PgUsersRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(UsersEmailConfirmation)
    private readonly emailConfirmationRepository: Repository<UsersEmailConfirmation>,
  ) {
    super();
  }

  async createUser(dto: CreateUserDto): Promise<{ userId: string }> {
    const {
      email,
      login,
      passwordHash,
      confirmationCode,
      expirationDate,
      confirmationStatus,
    } = dto;
    // Create user
    const user = new Users();
    user.email = email;
    user.login = login;
    user.passwordHash = passwordHash;

    // Create email confirmation
    const emailConfirmation = new UsersEmailConfirmation();
    emailConfirmation.confirmationCode = confirmationCode;
    emailConfirmation.expirationDate = expirationDate;
    emailConfirmation.status = confirmationStatus;

    // Set up the relationship
    user.emailConfirmation = emailConfirmation;

    // Save user (will cascade save email confirmation due to cascade: true)
    const savedUser: Users = await this.usersRepository.save(user);

    return { userId: savedUser.id.toString() };
  }

  async deleteUserById(userId: string): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const result = await this.usersRepository.softDelete(userId);

    // `result[affected]` contains the number of affected rows.
    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }

  async findUserByEmail(email: string): Promise<Users | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['emailConfirmation'],
    });

    return user;
  }

  async checkUserExists(userId: string): Promise<boolean> {
    if (!this.isCorrectNumber(userId)) {
      return false;
    }

    return await this.usersRepository.exists({
      where: { id: +userId },
    });
  }

  async findUserOrThrow(userId: string): Promise<Users> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const user = await this.usersRepository.findOne({
      where: { id: +userId },
      relations: ['emailConfirmation', 'passwordRecovery'],
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return user;
  }

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<Users | null> {
    const user = await this.usersRepository.findOne({
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
      relations: ['emailConfirmation'],
    });

    return user;
  }

  async isLoginOrEmailInUse(loginOrEmail: string): Promise<boolean> {
    // We should also check among the users who are soft-deleted
    return await this.usersRepository.exists({
      where: [
        {
          login: loginOrEmail,
        },
        {
          email: loginOrEmail,
        },
      ],
      withDeleted: true, // Include soft-deleted records in the check
    });
  }

  async findUserByConfirmationCode(
    confirmationCode: string,
  ): Promise<Users | null> {
    if (!this.isCorrectUuid(confirmationCode)) {
      return null;
    }
    const user: Users | null = await this.usersRepository.findOne({
      select: [],
      where: [{ emailConfirmation: { confirmationCode } }],
      relations: ['emailConfirmation'],
    });

    return user;
  }

  async findUserByPasswordRecoveryCode(
    recoveryCode: string,
  ): Promise<Users | null> {
    if (!this.isCorrectUuid(recoveryCode)) {
      return null;
    }

    const user = await this.usersRepository.findOne({
      select: [],
      where: [{ passwordRecovery: { recoveryCode } }],
      relations: ['passwordRecovery'],
    });

    return user;
  }

  async setNewEmailConfirmationData(
    userId: string,
    newConfirmationCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    user.emailConfirmation.confirmationCode = newConfirmationCode;
    user.emailConfirmation.expirationDate = newExpirationDate;
    user.emailConfirmation.status = EmailConfirmationStatus.Pending;

    await this.usersRepository.save(user);
  }

  async createNewPasswordRecoveryData(
    userId: string,
    newRecoveryCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    const passwordRecovery = new UsersPasswordRecovery();
    passwordRecovery.recoveryCode = newRecoveryCode;
    passwordRecovery.expirationDate = newExpirationDate;
    passwordRecovery.status = PasswordRecoveryStatus.Pending;

    user.passwordRecovery = passwordRecovery;

    await this.usersRepository.save(user);
  }

  async confirmUserEmail(userId: string): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const emailConfirmation = await this.emailConfirmationRepository.findOne({
      where: [{ user: { id: +userId } }],
      relations: ['user'],
    });

    if (!emailConfirmation) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    emailConfirmation.status = EmailConfirmationStatus.Confirmed;

    await this.emailConfirmationRepository.save(emailConfirmation);
  }

  async confirmPasswordRecovery(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    user.passwordHash = newPassword;

    await this.usersRepository.save(user);
  }
}
