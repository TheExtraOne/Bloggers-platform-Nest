import { Users } from '../../../users/domain/entities/user.entity';
import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Sessions extends BaseTimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', nullable: false })
  public ip: string;

  @Column({ type: 'varchar', nullable: false })
  public title: string;

  @Column({ type: 'timestamptz', nullable: false })
  public lastActiveDate: Date;

  @Column({ type: 'timestamptz', nullable: false })
  public expirationDate: Date;

  @ManyToOne(() => Users, (users) => users.sessions)
  @JoinColumn({ name: 'user_id' }) // Ensures correct FK column name
  user: Users;
}
