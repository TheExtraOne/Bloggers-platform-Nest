import { BaseWithId } from '../../../../../core/base-classes/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EmailConfirmationStatus } from '../enums/user.enum';
import { Users } from './user.entity';

/**
 * Entity representing email confirmation details for a user.
 * Extends BaseWithId to inherit id and timestamp fields.
 * Used to manage the email verification process for user accounts.
 */
@Entity()
export class UsersEmailConfirmation extends BaseWithId {
  /**
   * One-to-one relationship with the Users entity.
   * When the user is deleted, this record will also be deleted (CASCADE).
   */
  @OneToOne(() => Users, (user) => user.emailConfirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
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
