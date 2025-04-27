import { BaseWithId } from '../../../../core/base-classes/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Answers } from '../../answers/domain/answers.entity';

export const QUESTIONS_CONSTRAINTS = {
  MAX_QUESTION_LENGTH: 500,
  MIN_QUESTION_LENGTH: 10,
};

/**
 * Entity representing a quiz question in the system.
 * Extends BaseWithId to include common fields like id and timestamps.
 */
@Entity()
export class Questions extends BaseWithId {
  /**
   * The text content of the question.
   * @type {string}
   * @maxLength {QUESTIONS_CONSTRAINTS.MAX_QUESTION_LENGTH}
   */
  @Column({
    type: 'varchar',
    length: QUESTIONS_CONSTRAINTS.MAX_QUESTION_LENGTH,
    nullable: false,
  })
  public body: string;

  /**
   * Array of correct answers for the question.
   * @type {string[]}
   */
  @Column('varchar', { array: true, nullable: false })
  public correctAnswers: string[];

  /**
   * Indicates whether the question is published and available for quizzes.
   * @type {boolean}
   * @default false
   */
  @Column({ type: 'boolean', default: false })
  public published: boolean;

  /**
   * Collection of all answers given to this question across all games
   * @type {Answers[]}
   */
  @OneToMany(() => Answers, (answer) => answer.pairGame)
  public answers: Answers[];
}
