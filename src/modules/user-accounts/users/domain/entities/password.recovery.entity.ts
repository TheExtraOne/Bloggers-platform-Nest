import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { PasswordRecoveryStatus } from '../enums/user.enums';
import { Users } from './user.entity';

/**
 * Entity representing password recovery details for a user.
 * Extends BaseTimestampedEntity to inherit timestamp fields.
 * Used to manage the password recovery process when users forget their passwords.
 */
@Entity()
export class UsersPasswordRecovery extends BaseTimestampedEntity {
  /**
   * Primary key and foreign key referencing the user.
   * Links this recovery record to a specific user.
   */
  @PrimaryColumn() // Primary Key + Foreign Key
  userId: number;

  /**
   * One-to-one relationship with the Users entity.
   * When the user is deleted, this record will also be deleted (CASCADE).
   */
  @OneToOne(() => Users, (user) => user.passwordRecovery, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' }) // Ensures correct FK column name
  user: Users;

  /**
   * Date when the recovery code expires.
   * After this date, the code becomes invalid and a new one must be generated.
   */
  @Column({ type: 'timestamptz', nullable: true })
  expiration_date: Date;

  /**
   * Current status of password recovery process.
   * Tracks the state of the recovery request using PasswordRecoveryStatus enum.
   */
  @Column({
    type: 'enum',
    enum: PasswordRecoveryStatus,
    nullable: true,
  })
  status: PasswordRecoveryStatus;

  /**
   * Unique UUID code sent to user's email for password recovery.
   * Used to verify the recovery request and allow password reset.
   */
  @Column({ type: 'uuid', nullable: true })
  recovery_code: string;
}
