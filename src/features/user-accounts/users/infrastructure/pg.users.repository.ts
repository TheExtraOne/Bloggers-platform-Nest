import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';

@Injectable()
export class PgUsersRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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
}
