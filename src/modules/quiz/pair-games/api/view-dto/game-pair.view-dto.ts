import { AnswerStatus } from '../../../answers/domain/answers.entity';
import { GameStatus } from '../../domain/pair-game.entity';
import { ApiProperty } from '@nestjs/swagger';

class Player {
  @ApiProperty({
    description: 'Player ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Player login',
    example: 'user123'
  })
  login: string;
}

class Answers {
  @ApiProperty({
    description: 'Question ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  questionId: string;

  @ApiProperty({ 
    enum: AnswerStatus,
    description: 'Status of the answer'
  })
  answerStatus: AnswerStatus;

  @ApiProperty({ 
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Date when the answer was added'
  })
  addedAt: Date;
}

class Question {
  @ApiProperty({
    description: 'Question ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Question text',
    example: 'What is the capital of France?'
  })
  body: string;
}

class PlayerProgress {
  @ApiProperty({ 
    type: [Answers], 
    nullable: true,
    description: 'List of player answers'
  })
  answers: Answers[] | [];

  @ApiProperty({ 
    type: Player,
    description: 'Player information'
  })
  player: Player;

  @ApiProperty({
    description: 'Player score',
    example: 5,
    minimum: 0
  })
  score: number;
}

export class PairViewDto {
  @ApiProperty({
    description: 'Game ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    type: PlayerProgress,
    description: 'First player progress information'
  })
  firstPlayerProgress: PlayerProgress;

  @ApiProperty({ 
    type: PlayerProgress, 
    nullable: true,
    description: 'Second player progress information (null if not joined)'
  })
  secondPlayerProgress: PlayerProgress | null;

  @ApiProperty({ 
    type: [Question], 
    nullable: true,
    description: 'List of game questions (null if game not started)'
  })
  questions: Question[] | null;

  @ApiProperty({ 
    enum: GameStatus,
    description: 'Current game status'
  })
  status: GameStatus;

  @ApiProperty({ 
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Date when the pair game was created'
  })
  pairCreatedDate: Date;

  @ApiProperty({ 
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Date when the game started',
    nullable: true 
  })
  startGameDate: Date | null;

  @ApiProperty({ 
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
    description: 'Date when the game finished',
    nullable: true 
  })
  finishGameDate: Date | null;
}
