import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { PasswordRecoveryStatus } from '../enums/user.enums';
import { Users } from './user.entity';

@Entity()
export class UsersPasswordRecovery extends BaseTimestampedEntity {
  @PrimaryColumn() // Primary Key + Foreign Key
  userId: number;

  @OneToOne(() => Users, (user) => user.passwordRecovery, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' }) // Ensures correct FK column name
  user: Users;

  @Column({ type: 'timestamptz', nullable: true })
  expiration_date: Date;

  @Column({
    type: 'enum',
    enum: PasswordRecoveryStatus,
    nullable: true,
  })
  status: PasswordRecoveryStatus;

  @Column({ type: 'uuid', nullable: true })
  recovery_code: string;
}
