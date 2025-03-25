import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { EmailConfirmationStatus } from '../enums/user.enums';
import { Users } from './user.entity';

@Entity()
export class UsersEmailConfirmation extends BaseTimestampedEntity {
  @PrimaryColumn() // Primary Key + Foreign Key
  userId: number;

  @OneToOne(() => Users, (user) => user.emailConfirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' }) // Ensures correct FK column name
  user: Users;

  @Column({ type: 'timestamptz', nullable: true })
  expirationDate: Date | null;

  @Column({
    type: 'enum',
    enum: EmailConfirmationStatus,
    default: EmailConfirmationStatus.Pending,
    nullable: true,
  })
  status: EmailConfirmationStatus | null;

  @Column({ type: 'uuid', nullable: true })
  confirmationCode: string | null;
}
