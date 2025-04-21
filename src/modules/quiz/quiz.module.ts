import { Module } from '@nestjs/common';
import { QuestionController } from './questions/api/questions.controller';
import { CreateQuestionUseCase } from './questions/app/use-cases/create-question.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Questions } from './questions/domain/question.entity';
import { PgQuestionsRepository } from './questions/infrastructure/pg.questions.repository';
import { GetQuestionByIdQueryHandler } from './questions/app/queries/get-question-by-id.query';
import { PgQuestionsQueryRepository } from './questions/infrastructure/query/pg.questions.query-repository';
import { GetAllQuestionsQueryHandler } from './questions/app/queries/get-all-questions.query';
import { DeleteQuestionUseCase } from './questions/app/use-cases/delete-question.use-case';
import { PublishQuestionUseCase } from './questions/app/use-cases/publish-question.use-case';
import { UpdateQuestionUseCase } from './questions/app/use-cases/update-question.use-case';
import { GamePairsController } from './pair-games/api/game-pairs.controller';
import { PlayerProgress } from './player-progress/domain/player-progress.entity';
import { PairGames } from './pair-games/domain/pair-game.entity';
import { Answers } from './answers/domain/answers.entity';

const questionUseCases = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  PublishQuestionUseCase,
  UpdateQuestionUseCase,
];
const questionQueries = [
  GetQuestionByIdQueryHandler,
  GetAllQuestionsQueryHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Questions, PairGames, PlayerProgress, Answers]),
  ],
  controllers: [QuestionController, GamePairsController],
  providers: [
    ...questionUseCases,
    ...questionQueries,
    PgQuestionsRepository,
    PgQuestionsQueryRepository,
  ],
  exports: [],
})
export class QuizModule {}
