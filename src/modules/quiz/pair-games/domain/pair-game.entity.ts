import { BaseWithId } from '../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { Answers } from '../../answers/domain/answers.entity';

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Started = 'Active',
  Finished = 'Finished',
}

interface Questions {
  id: string;
  body: string;
}
/**
 * Entity representing a pair game session in the quiz system.
 * 
 * This entity manages the game state between two players, including:
 * - Game timing (start and finish)
 * - Current game status
 * - Questions for the game
 * - Progress tracking for both players
 * - All answers submitted during the game
 *
 * @entity PairGames
 * @extends BaseWithId
 */
@Entity()
export class PairGames extends BaseWithId {
  /**
   * The timestamp when the game started
   * @type {Date | null}
   */
  @Column({ type: 'timestamptz', nullable: true })
  public startGameDate: Date | null;

  /**
   * The timestamp when the game finished
   * @type {Date | null}
   */
  @Column({ type: 'timestamptz', nullable: true })
  public finishGameDate: Date | null;

  /**
   * Current status of the game (PendingSecondPlayer, Active, or Finished)
   * @type {GameStatus}
   * @default GameStatus.PendingSecondPlayer
   */
  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PendingSecondPlayer,
  })
  public status: GameStatus;

  /**
   * Array of questions assigned to this game
   * @type {Questions[] | null}
   */
  @Column({ type: 'jsonb', nullable: true })
  public questions: Questions[] | null;

  /**
   * Progress tracking for the first player
   * @type {PlayerProgress}
   */
  @OneToOne(() => PlayerProgress, {
    cascade: true,
    // for automatic joining
    // eager: true
  })
  @JoinColumn({ name: 'first_player_progress_id' })
  public firstPlayerProgress: PlayerProgress;

  /**
   * Progress tracking for the second player
   * @type {PlayerProgress | null}
   */
  @OneToOne(() => PlayerProgress, {
    cascade: true,
    // for automatic joining
    // eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'second_player_progress_id' })
  public secondPlayerProgress: PlayerProgress | null;

  /**
   * Collection of all answers submitted during this game
   * @type {Answers[]}
   */
  @OneToMany(() => Answers, (answer) => answer.pairGame)
  public answers: Answers[];
}
