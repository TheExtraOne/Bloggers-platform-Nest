import { IsEnum, ValidateIf } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { QuestionsSortBy } from './questions-sort-by';
import { QuestionsPublishStatus } from './questions-publish-status';

export class GetQuestionsQueryParams extends BaseSortablePaginationParams<QuestionsSortBy> {
  @ValidateIf(
    (o: Record<string, string | undefined>) => typeof o.sortBy !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(QuestionsSortBy)
  sortBy = QuestionsSortBy.CreatedAt;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.bodySearchTerm !== 'undefined' && o.bodySearchTerm !== null,
  )
  @IsStringWithTrim()
  bodySearchTerm: string | null = null;

  @ValidateIf(
    (o: Record<string, string | undefined>) =>
      typeof o.publishedStatus !== 'undefined',
  )
  @IsStringWithTrim()
  @IsEnum(QuestionsPublishStatus)
  publishedStatus = QuestionsPublishStatus.All;
}
