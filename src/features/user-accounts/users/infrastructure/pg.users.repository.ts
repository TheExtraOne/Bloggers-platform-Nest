import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { ERRORS } from 'src/constants';
import { PGUserViewDto } from '../api/view-dto/users.view-dto';
import { EmailConfirmationStatus } from '../domain/email-confirmation.schema';
import { PasswordRecoveryStatus } from '../domain/password-recovery.schema';

// TODO: refactor types
@Injectable()
export class PgUsersRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // TODO: we don't need to create password recovery records for new users right here.
  async createUser(dto: CreateUserDomainDto): Promise<{ userId: string }> {
    // 1. define temporary query results (Common Table Expressions - CTEs) inserted_user. The WITH statement allows us to define temporary query results (CTEs) that can be used within the main query.
    // 2. insert new user into users table and get inserted id into inserted_user cte.
    // 3. insert email confirmation details into the users_email_confirmation table. The user_id comes from the inserted_user CTE, ensuring that the confirmation is linked to the new user.
    // 4. insert password recovery details into the users_password_recovery table. The user_id comes from the inserted_user CTE, ensuring that the password recovery is linked to the new user.
    // 5. return the user id.
    const query = `
      WITH inserted_user AS (
        INSERT INTO public.users (email, password_hash, login)
        VALUES ($1, $2, $3)
        RETURNING id
      ),
      email_confirmation AS (
        INSERT INTO public.users_email_confirmation (user_id, confirmation_code, expiration_date, confirmation_status)
        SELECT id, $4, $5, $6
        FROM inserted_user
      ),
      password_recovery AS (
        INSERT INTO public.users_password_recovery (user_id)
        SELECT id FROM inserted_user
      )
      SELECT id FROM inserted_user;
    `;

    const params = [
      dto.email,
      dto.passwordHash,
      dto.login,
      dto.confirmationCode,
      dto.expirationDate,
      dto.confirmationStatus,
    ];

    const result = await this.dataSource.query(query, params);

    return { userId: result[0].id.toString() };
  }

  async deleteUserById(userId: string): Promise<void> {
    // TODO: find a better way to handle id
    if (!this.validateUserId(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    // TODO: should update 'updated_at' field as well?
    const query = `
    UPDATE public.users
    SET deleted_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id;
    `;
    const params = [userId];

    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
  }

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

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<{
    id: string;
    confirmationStatus: EmailConfirmationStatus;
    passwordHash: string;
  } | null> {
    const result:
      | [
          {
            id: string;
            confirmation_status: EmailConfirmationStatus;
            password_hash: string;
          },
        ]
      | [] = await this.dataSource.query(
      `
        SELECT u.id, u.password_hash, uem.confirmation_status
        FROM public.users as u
		    LEFT JOIN public.users_email_confirmation as uem
		    ON u.id = uem.user_id
        WHERE u.login = $1 OR u.email = $1 AND u.deleted_at IS NULL;
      `,
      [loginOrEmail],
    );
    const user = result[0];
    return user
      ? {
          id: user.id,
          confirmationStatus: user.confirmation_status,
          passwordHash: user.password_hash,
        }
      : null;
  }

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

  async setNewEmailConfirmationData(
    userId: string,
    newConfirmationCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    // TODO: find a better way to handle id
    if (!this.validateUserId(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    // TODO: Do I need to change 'update_at' in users table as well?
    const query = `
      UPDATE public.users_email_confirmation
      SET confirmation_code = $2, expiration_date = $3, confirmation_status = $4
      WHERE user_id = $1;
    `;
    const params = [
      userId,
      newConfirmationCode,
      newExpirationDate,
      EmailConfirmationStatus.Pending,
    ];

    await this.dataSource.query(query, params);
  }

  async setNewPasswordRecoveryData(
    userId: string,
    newRecoveryCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    // TODO: find a better way to handle id
    if (!this.validateUserId(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    // TODO: Do I need to change 'update_at' in users table as well?
    const query = `
      UPDATE public.users_password_recovery
      SET recovery_code = $2, expiration_date = $3, recovery_status = $4
      WHERE user_id = $1;
    `;
    const params = [
      userId,
      newRecoveryCode,
      newExpirationDate,
      PasswordRecoveryStatus.Pending,
    ];

    await this.dataSource.query(query, params);
  }

  async confirmUserEmail(userId: string): Promise<void> {
    // TODO: find a better way to handle id
    if (!this.validateUserId(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }
    // TODO: Do I need to change 'update_at' in users table as well?
    const query = `
      UPDATE public.users_email_confirmation
      SET confirmation_status = $2
      WHERE user_id = $1;
    `;
    const params = [userId, EmailConfirmationStatus.Confirmed];

    await this.dataSource.query(query, params);
  }

  async confirmPasswordRecovery(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    // TODO: find a better way to handle id
    if (!this.validateUserId(userId)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const query = `
      WITH update_password_recovery AS 
      (UPDATE public.users_password_recovery
      SET recovery_code = null, expiration_date = null, recovery_status = $3
      WHERE user_id = $1),

      update_user AS (UPDATE public.users
      SET updated_at = NOW(), password_hash = $2
      WHERE id = $1)

      SELECT 1; -- Dummy select to complete the query.
    `;
    const params = [userId, newPassword, PasswordRecoveryStatus.Confirmed];

    await this.dataSource.query(query, params);
  }

  private validateUserId(userId: string): boolean {
    if (isNaN(Number(userId))) {
      return false;
    }

    return true;
  }
}
