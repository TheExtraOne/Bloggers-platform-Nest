import { AnswerStatus } from '../../../answers/domain/answers.entity';
import { GameStatus } from '../../domain/pair-game.entity';
import { ApiProperty } from '@nestjs/swagger';

class Player {
  @ApiProperty()
  id: string;

  @ApiProperty()
  login: string;
}

class Answers {
  @ApiProperty()
  questionId: string;

  @ApiProperty({ enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @ApiProperty()
  addedAt: Date;
}

class Question {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body: string;
}

class PlayerProgress {
  @ApiProperty({ type: [Answers], nullable: true })
  answers: Answers[] | null;

  @ApiProperty({ type: Player })
  player: Player;

  @ApiProperty()
  score: number;
}

export class PairViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: PlayerProgress })
  firstPlayerProgress: PlayerProgress;

  @ApiProperty({ type: PlayerProgress, nullable: true })
  secondPlayerProgress: PlayerProgress | null;

  @ApiProperty({ type: [Question], nullable: true })
  questions: Question[] | null;

  @ApiProperty({ enum: GameStatus })
  status: GameStatus;

  @ApiProperty()
  pairCreatedDate: Date;

  @ApiProperty({ nullable: true })
  startGameDate: Date | null;

  @ApiProperty({ nullable: true })
  finishGameDate: Date | null;
}
