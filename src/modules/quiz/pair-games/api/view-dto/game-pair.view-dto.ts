import { AnswerStatus } from '../../../answers/domain/answers.entity';
import { GameStatus } from '../../domain/pair-game.entity';
import { ApiProperty } from '@nestjs/swagger';

class Player {
  id: string;
  login: string;
}

class Answers {
  questionId: string;
  @ApiProperty({ enum: AnswerStatus })
  answerStatus: AnswerStatus;
  addedAt: Date;
}

class Question {
  id: string;
  body: string;
}

class PlayerProgress {
  @ApiProperty({ type: [Answers], nullable: true })
  answers: Answers[] | [];
  @ApiProperty({ type: Player })
  player: Player;
  score: number;
}

export class PairViewDto {
  id: string;

  @ApiProperty({ type: PlayerProgress })
  firstPlayerProgress: PlayerProgress;

  @ApiProperty({ type: PlayerProgress, nullable: true })
  secondPlayerProgress: PlayerProgress | null;

  @ApiProperty({ type: [Question], nullable: true })
  questions: Question[] | null;

  @ApiProperty({ enum: GameStatus })
  status: GameStatus;

  pairCreatedDate: Date;

  startGameDate: Date | null;

  finishGameDate: Date | null;
}
