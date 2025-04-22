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

/**
 * Entity representing a player's progress in quiz games.
 * 
 * This entity tracks:
 * - Player's score
 * - Games where the player participated (as first or second player)
 * - All answers submitted by the player
 * - Association with the user account
 *
 * @entity PlayerProgress
 * @extends BaseWithId
 */
@Entity()
export class PlayerProgress extends BaseWithId {
  /**
   * The player's current score in the game
   * @type {number}
   * @default 0
   */
  @Column({ type: 'integer', default: 0, nullable: false })
  public score: number;

  /**
   * The user account associated with this progress
   * @type {Users}
   */
  @ManyToOne(() => Users, (users) => users.playerProgress)
  @JoinColumn({ name: 'user_id' })
  public user: Users;

  /**
   * Games where this player is the first player
   * @type {PairGames}
   */
  @OneToOne(() => PairGames, (pg) => pg.firstPlayerProgress)
  public firstPlayerGame: PairGames;

  /**
   * Games where this player is the second player
   * @type {PairGames}
   */
  @OneToOne(() => PairGames, (pg) => pg.secondPlayerProgress)
  public secondPlayerGame: PairGames;

  /**
   * Collection of all answers submitted by this player
   * @type {Answers[] | null}
   */
  @OneToMany(() => Answers, (answer) => answer.playerProgress)
  public answers: Answers[] | null;
}
