import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ERRORS } from '../../../../constants';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import {
  EmailConfirmationStatus,
  PasswordRecoveryStatus,
} from '../domain/enums/user.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { Users } from '../domain/entities/user.entity';
import { UsersEmailConfirmation } from '../domain/entities/email.confirmation.entity';

// TODO: refactor types
export class SetNewConfirmationDataDto {
  confirmationCode: string | null;
  expirationDate: Date | null;
  confirmationStatus: EmailConfirmationStatus;
}

@Injectable()
export class PgUsersRepository extends PgBaseRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {
    super();
  }

  async createUser(dto: CreateUserDto): Promise<{ userId: string }> {
    // TODO: should it be part of service?
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

    // softDelete
    const result = await this.usersRepository.softDelete(userId);

    // `result[affected]` contains the number of affected rows.
    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }

  // TODO
  async findUserByEmail(email: string): Promise<{
    id: string;
    confirmationStatus: EmailConfirmationStatus;
  } | null> {
    const result:
      | [{ id: string; confirmation_status: EmailConfirmationStatus }]
      | [] = await this.dataSource.query(
      `
        SELECT u.id, uec.confirmation_status
        FROM public.users as u
        LEFT JOIN public.users_email_confirmation as uec
	      ON u.id = uec.user_id
        WHERE u.email = $1 AND u.deleted_at IS NULL;
      `,
      [email],
    );

    const user = result[0];

    return user
      ? { id: user.id, confirmationStatus: user.confirmation_status }
      : null;
  }

  // TODO
  async findUserById(userId: string): Promise<{
    userId: string;
  } | null> {
    if (!this.isCorrectNumber(userId)) {
      return null;
    }

    const result:
      | [
          {
            user_id: string;
          },
        ]
      | [] = await this.dataSource.query(
      `
        SELECT u.id as user_id
        FROM public.users as u
        WHERE u.id = $1 AND u.deleted_at IS NULL;
      `,
      [userId],
    );
    const user = result[0];
    return user
      ? {
          userId: user.user_id,
        }
      : null;
  }

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<Users | null> {
    // const user = await this.usersRepository
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect('user.emailConfirmation', 'emailConfirmation')
    //   .where('user.login = :loginOrEmail OR user.email = :loginOrEmail', {
    //     loginOrEmail,
    //   })
    //   .getOne();

    const user = await this.usersRepository.findOne({
      select: ['id'],
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
      relations: ['emailConfirmation'],
    });

    return user;
  }

  async isLoginOrEmailInUse(loginOrEmail: string): Promise<boolean> {
    // We should also check among the users who are soft-deleted
    const exists: number = await this.usersRepository.count({
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

    return !!exists;
  }

  // TODO
  async findUserByConfirmationCode(confirmationCode: string): Promise<{
    id: string;
    confirmationStatus: EmailConfirmationStatus;
    confirmationCode: string;
    expirationDate: Date;
  } | null> {
    const result:
      | [
          {
            id: string;
            confirmation_status: EmailConfirmationStatus;
            confirmation_code: string;
            expiration_date: Date;
          },
        ]
      | [] = await this.dataSource.query(
      `
      SELECT uec.confirmation_status, uec.confirmation_code,uec.expiration_date, u.id
      FROM public.users_email_confirmation as uec
      LEFT JOIN public.users as u
      ON u.id = uec.user_id
      WHERE uec.confirmation_code = $1 AND u.deleted_at IS NULL;
    `,
      [confirmationCode],
    );
    const user = result[0];
    return user
      ? {
          id: user.id,
          confirmationStatus: user.confirmation_status,
          confirmationCode: user.confirmation_code,
          expirationDate: user.expiration_date,
        }
      : null;
  }

  // TODO
  async findUserByPasswordRecoveryCode(recoveryCode: string): Promise<{
    id: string;
    recoveryStatus: PasswordRecoveryStatus;
    recoveryCode: string;
    expirationDate: Date;
  } | null> {
    const result:
      | [
          {
            id: string;
            recovery_status: PasswordRecoveryStatus;
            recovery_code: string;
            expiration_date: Date;
          },
        ]
      | [] = await this.dataSource.query(
      `
      SELECT upr.recovery_status, upr.recovery_code, upr.expiration_date, u.id
      FROM public.users_password_recovery as upr
      LEFT JOIN public.users as u
      ON u.id = upr.user_id
      WHERE upr.recovery_code = $1 AND u.deleted_at IS NULL;
    `,
      [recoveryCode],
    );
    const user = result[0];
    return user
      ? {
          id: user.id,
          recoveryStatus: user.recovery_status,
          recoveryCode: user.recovery_code,
          expirationDate: user.expiration_date,
        }
      : null;
  }

  // TODO
  async setNewEmailConfirmationData(
    userId: string,
    newConfirmationCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    const query = `
      UPDATE public.users_email_confirmation
      SET confirmation_code = $2, expiration_date = $3, confirmation_status = $4, updated_at = NOW()
      WHERE user_id = $1;
    `;
    const params = [
      userId,
      newConfirmationCode,
      newExpirationDate,
      EmailConfirmationStatus.Pending,
    ];

    const result = await this.dataSource.query(query, params);
    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }

  // TODO
  async createNewPasswordRecoveryData(
    userId: string,
    newRecoveryCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const query = `
      INSERT INTO public.users_password_recovery
      (user_id, recovery_code, expiration_date, recovery_status)
      VALUES ($1, $2, $3, $4);
    `;
    const params = [
      userId,
      newRecoveryCode,
      newExpirationDate,
      PasswordRecoveryStatus.Pending,
    ];

    await this.dataSource.query(query, params);
  }

  // TODO
  async confirmUserEmail(userId: string): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    const query = `
      UPDATE public.users_email_confirmation
      SET confirmation_status = $2, updated_at = NOW()
      WHERE user_id = $1;
    `;
    const params = [userId, EmailConfirmationStatus.Confirmed];

    const result = await this.dataSource.query(query, params);
    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }

  // TODO
  async confirmPasswordRecovery(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    if (!this.isCorrectNumber(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const query = `
      WITH update_password_recovery AS 
      (UPDATE public.users_password_recovery
      SET recovery_code = null, expiration_date = null, recovery_status = $3, updated_at = NOW()
      WHERE user_id = $1),

      update_user AS (UPDATE public.users
      SET updated_at = NOW(), password_hash = $2
      WHERE id = $1)

      SELECT 1; -- Dummy select to complete the query.
    `;
    const params = [userId, newPassword, PasswordRecoveryStatus.Confirmed];

    const result = await this.dataSource.query(query, params);
    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }
}
