import { BaseWithId } from '../../../../core/base-entities/base.entity';
import { Users } from '../../../user-accounts/users/domain/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PairGames } from '../../pair-games/domain/pair-game.entity';
import { Answers } from '../../answers/domain/answers.entity';

@Entity()
export class PlayerProgress extends BaseWithId {
  @Column({ type: 'integer', default: 0, nullable: false })
  public score: number;

  @ManyToOne(() => Users, (users) => users.playerProgress)
  @JoinColumn({ name: 'user_id' })
  public user: Users;

  @OneToOne(() => PairGames, (pg) => pg.firstPlayerProgress)
  public firstPlayerGame: PairGames;

  @OneToOne(() => PairGames, (pg) => pg.secondPlayerProgress)
  public secondPlayerGame: PairGames;

  @OneToMany(() => Answers, (answer) => answer.playerProgress)
  public answers: Answers[] | null;
}
