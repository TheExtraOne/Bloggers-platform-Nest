import { BaseWithId } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { UsersEmailConfirmation } from './email.confirmation.entity';
import { UsersPasswordRecovery } from './password.recovery.entity';

@Entity()
export class Users extends BaseWithId {
  @Column({ unique: true, type: 'varchar', length: 10, nullable: false })
  public login: string;

  @Column({ unique: true, type: 'varchar', length: 30, nullable: false })
  public email: string;

  @Column({ nullable: false })
  public passwordHash: string;

  @OneToOne(
    () => UsersEmailConfirmation,
    (emailConfirmation) => emailConfirmation.user,
    {
      onDelete: 'CASCADE',
      cascade: ['update', 'remove'],
    },
  )
  emailConfirmation: UsersEmailConfirmation;

  @OneToOne(
    () => UsersPasswordRecovery,
    (passwordRecovery) => passwordRecovery.user,
    {
      onDelete: 'CASCADE',
      cascade: ['update', 'remove'],
    },
  )
  passwordRecovery: UsersPasswordRecovery;
}
