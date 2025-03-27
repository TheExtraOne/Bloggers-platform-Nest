import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { EmailConfirmationStatus } from '../enums/user.enums';
import { Users } from './user.entity';

/**
 * Entity representing email confirmation details for a user.
 * Extends BaseTimestampedEntity to inherit timestamp fields.
 * Used to manage the email verification process for user accounts.
 */
@Entity()
export class UsersEmailConfirmation extends BaseTimestampedEntity {
  /**
   * Primary key and foreign key referencing the user.
   * Links this confirmation record to a specific user.
   */
  @PrimaryColumn() // Primary Key + Foreign Key
  public userId: number;

  /**
   * One-to-one relationship with the Users entity.
   * When the user is deleted, this record will also be deleted (CASCADE).
   */
  @OneToOne(() => Users, (user) => user.emailConfirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' }) // Ensures correct FK column name
  public user: Users;

  /**
   * Date when the confirmation code expires.
   * After this date, the code becomes invalid and a new one must be generated.
   */
  @Column({ type: 'timestamptz', nullable: true })
  public expirationDate: Date | null;

  /**
   * Current status of email confirmation.
   * Can be Pending, Confirmed, or other states defined in EmailConfirmationStatus enum.
   * Defaults to Pending status.
   */
  @Column({
    type: 'enum',
    enum: EmailConfirmationStatus,
    default: EmailConfirmationStatus.Pending,
    nullable: true,
  })
  public status: EmailConfirmationStatus | null;

  /**
   * Unique UUID code sent to user's email for confirmation.
   * Used to verify the user's email address.
   */
  @Column({ type: 'uuid', nullable: true })
  public confirmationCode: string | null;
}
