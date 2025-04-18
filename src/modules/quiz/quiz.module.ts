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

const questionUseCases = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  PublishQuestionUseCase,
];
const questionQueries = [
  GetQuestionByIdQueryHandler,
  GetAllQuestionsQueryHandler,
];

@Module({
  imports: [TypeOrmModule.forFeature([Questions])],
  controllers: [QuestionController],
  providers: [
    ...questionUseCases,
    ...questionQueries,
    PgQuestionsRepository,
    PgQuestionsQueryRepository,
  ],
  exports: [],
})
export class QuizModule {}
