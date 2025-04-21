import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { PairGames } from '../../pair-games/domain/pair-game.entity';
import { BaseWithId } from '../../../../core/base-entities/base.entity';
import { Questions } from '../../questions/domain/question.entity';

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}

@Entity()
export class Answers extends BaseWithId {
  @Column()
  public questionId: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  public answerStatus: AnswerStatus;

  @Column({ type: 'varchar' })
  public answerBody: string;

  @ManyToOne(() => PlayerProgress, (progress) => progress.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_progress_id' })
  public playerProgress: PlayerProgress;

  @ManyToOne(() => PairGames, (game) => game.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pair_game_id' })
  public pairGame: PairGames;

  @ManyToOne(() => Questions, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  public question: Questions;
}
