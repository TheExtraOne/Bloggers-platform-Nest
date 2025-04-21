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

@Entity()
export class PairGames extends BaseWithId {
  @Column({ type: 'timestamptz', nullable: true })
  public startGameDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  public finishGameDate: Date | null;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PendingSecondPlayer,
  })
  public status: GameStatus;

  @Column({ type: 'jsonb', nullable: true })
  public questions: Questions[] | null;

  @OneToOne(() => PlayerProgress, {
    cascade: true,
    // for automatic joining
    // eager: true
  })
  @JoinColumn({ name: 'first_player_progress_id' })
  public firstPlayerProgress: PlayerProgress;

  @OneToOne(() => PlayerProgress, {
    cascade: true,
    // for automatic joining
    // eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'second_player_progress_id' })
  public secondPlayerProgress: PlayerProgress | null;

  @OneToMany(() => Answers, (answer) => answer.pairGame)
  public answers: Answers[];
}
