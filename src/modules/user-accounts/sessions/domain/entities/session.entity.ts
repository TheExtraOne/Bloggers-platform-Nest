import { Users } from '../../../users/domain/entities/user.entity';
import { BaseTimestampedEntity } from '../../../../../core/base-classes/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entity representing user sessions in the system.
 * Extends BaseTimestampedEntity to include creation and update timestamps.
 * Tracks user session information including IP address, device info, and expiration.
 */
@Entity()
export class Sessions extends BaseTimestampedEntity {
  /**
   * Unique identifier for the session (deviceId)
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  /**
   * IP address from which the session was created
   * @type {string}
   */
  @Column({ type: 'varchar', nullable: false })
  public ip: string;

  /**
   * Title/description of the session (e.g., device or browser info)
   * @type {string}
   */
  @Column({ type: 'varchar', nullable: false })
  public title: string;

  /**
   * Timestamp of the last activity in this session
   * @type {Date}
   */
  @Column({ type: 'timestamptz', nullable: false })
  public lastActiveDate: Date;

  /**
   * Timestamp when this session expires
   * @type {Date}
   */
  @Column({ type: 'timestamptz', nullable: false })
  public expirationDate: Date;

  /**
   * User associated with this session
   * @type {Users}
   */
  @ManyToOne(() => Users, (users) => users.sessions)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
