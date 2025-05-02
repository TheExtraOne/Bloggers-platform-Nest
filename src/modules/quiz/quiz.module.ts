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
import { GamePairsController } from './pair-games/api/game-pairs-pairs.controller';
import { PlayerProgress } from './player-progress/domain/player-progress.entity';
import { PairGames } from './pair-games/domain/pair-game.entity';
import { Answers } from './answers/domain/answers.entity';
import { ConnectUserUseCase } from './pair-games/app/use-cases/connect-user.use-case';
import { PairGamesRepository } from './pair-games/infrastructure/pair-games.repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { PairGamesQueryRepository } from './pair-games/infrastructure/query/pair-games.query-repository';
import { GetGameByIdQueryHandler } from './pair-games/app/queries/get-game-by-id.query';
import { PairGameService } from './pair-games/app/pair-game.service';
import { GetActiveGameByUserIdQueryHandler } from './pair-games/app/queries/get-game-by-userid.query';
import { SetUserAnswerUseCase } from './answers/app/use-cases/set-user-answer.use-case';
import { PlayerProgressRepository } from './player-progress/infrastructure/player-progress.repository';
import { AnswerRepository } from './answers/infrastructure/answer.repository';
import { AnswerQueryRepository } from './answers/infrastructure/query/answer.query.repository';
import { GetAnswerByIdQueryHandler } from './answers/app/queries/get-answer-by-id.query';
import { GetAllGamesByUserIdQueryHandler } from './pair-games/app/queries/get-all-games-by-userid.query';
import { GameUsersController } from './pair-games/api/game-pairs-users.controller';
import { GetUserStatisticQueryHandler } from './pair-games/app/queries/get-user-statistic.query';

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
const pairGameUseCases = [ConnectUserUseCase];
const pairGameQueries = [
  GetGameByIdQueryHandler,
  GetActiveGameByUserIdQueryHandler,
  GetAllGamesByUserIdQueryHandler,
  GetUserStatisticQueryHandler,
];
const answerUseCases = [SetUserAnswerUseCase];
const answerQueries = [GetAnswerByIdQueryHandler];

@Module({
  imports: [
    UserAccountsModule,
    TypeOrmModule.forFeature([Questions, PairGames, PlayerProgress, Answers]),
  ],
  controllers: [QuestionController, GamePairsController, GameUsersController],
  providers: [
    ...questionUseCases,
    ...questionQueries,
    ...pairGameUseCases,
    ...pairGameQueries,
    ...answerUseCases,
    ...answerQueries,
    PairGameService,
    PgQuestionsRepository,
    PgQuestionsQueryRepository,
    PairGamesRepository,
    PairGamesQueryRepository,
    PlayerProgressRepository,
    AnswerRepository,
    AnswerQueryRepository,
  ],
  exports: [],
})
export class QuizModule {}
