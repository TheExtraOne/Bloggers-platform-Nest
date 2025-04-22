import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { PairGames } from '../../pair-games/domain/pair-game.entity';
import { BaseWithId } from '../../../../core/base-entities/base.entity';
import { Questions } from '../../questions/domain/question.entity';

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}

/**
 * Entity representing an answer given by a player in a quiz game.
 *
 * This entity stores information about answers provided during quiz games, including:
 * - The answer's correctness status
 * - The actual answer content
 * - Relationships with the associated player progress, pair game, and question
 *
 * @entity Answers
 * @extends BaseWithId
 */
@Entity()
export class Answers extends BaseWithId {
  /**
   * The status of the answer (Correct or Incorrect)
   * @type {AnswerStatus}
   */
  @Column({ type: 'enum', enum: AnswerStatus })
  public answerStatus: AnswerStatus;

  /**
   * The actual answer content provided by the player
   * @type {string}
   */
  @Column({ type: 'varchar' })
  public answerBody: string;

  /**
   * The player's progress record associated with this answer
   * @type {PlayerProgress}
   */
  @ManyToOne(() => PlayerProgress, (progress) => progress.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_progress_id' })
  public playerProgress: PlayerProgress;

  /**
   * The pair game associated with this answer
   * @type {PairGames}
   */
  @ManyToOne(() => PairGames, (game) => game.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pair_game_id' })
  public pairGame: PairGames;

  /**
   * The question entity this answer relates to
   * @type {Questions}
   */
  @ManyToOne(() => Questions, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  public question: Questions;
}
