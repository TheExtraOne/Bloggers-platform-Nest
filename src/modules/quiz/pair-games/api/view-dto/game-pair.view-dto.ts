import { AnswerStatus } from '../../../answers/domain/answers.entity';
import { Questions } from '../../../questions/domain/question.entity';
import { GameStatus } from '../../domain/pair-game.entity';

interface Answers {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: Date;
}

interface PlayerProgress {
  answers: Answers[] | null;
  player: {
    id: string;
    login: string;
  };
  score: number;
}

export class PairViewDto {
  id: string;
  firstPlayerProgress: PlayerProgress;
  secondPlayerProgress: PlayerProgress | null;
  questions: Questions[] | null;
  status: GameStatus;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;
}
