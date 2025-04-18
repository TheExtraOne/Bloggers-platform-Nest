import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from 'src/constants';
import { Questions } from '../../domain/question.entity';
import { PGQuestionViewDto } from '../../api/view-dto/question.view-dto';
import { GetQuestionsQueryParams } from '../../api/input-dto/get-questions.query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated-view.dto';
import { QuestionsPublishStatus } from '../../api/input-dto/questions-publish-status';

@Injectable()
export class PgQuestionsQueryRepository extends PgBaseRepository {
  private readonly allowedColumns = ['created_at', 'body'] as const;

  constructor(
    @InjectRepository(Questions)
    private readonly questionsRepository: Repository<Questions>,
  ) {
    super();
  }

  async getQuestionById(id: string): Promise<PGQuestionViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    // Used query builder in order to avoid extra mapping
    const question: PGQuestionViewDto | undefined =
      await this.questionsRepository
        .createQueryBuilder('question')
        .select([
          'question.id::text AS id', // cast to text, alias as `id`
          'question.body AS body',
          'question.correctAnswers AS "correctAnswers"',
          'question.published AS published',
          'question.createdAt AS "createdAt"',
          'question.updatedAt AS "updatedAt"',
        ])
        .where('question.id = :id', { id: +id })
        .getRawOne();

    if (!question) throw new NotFoundException(ERRORS.QUESTION_NOT_FOUND);

    return question;
  }

  async findAll(
    query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<PGQuestionViewDto[]>> {
    const {
      bodySearchTerm,
      publishedStatus,
      sortBy,
      sortDirection,
      pageNumber,
      pageSize,
    } = query;

    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    // Used query builder in order to avoid extra mapping
    const builder = this.questionsRepository
      .createQueryBuilder('question')
      .select([
        'question.id::text AS id', // cast to text, alias as `id`
        'question.body AS body',
        'question.correctAnswers AS "correctAnswers"',
        'question.published AS published',
        'question.createdAt AS "createdAt"',
        'question.updatedAt AS "updatedAt"',
      ])
      .orderBy(`question.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit);

    this.applyQuestionFilters(builder, bodySearchTerm, publishedStatus);

    const totalCountBuilder =
      this.questionsRepository.createQueryBuilder('question');

    this.applyQuestionFilters(
      totalCountBuilder,
      bodySearchTerm,
      publishedStatus,
    );

    const [questions, totalCount]: [PGQuestionViewDto[], number] =
      await Promise.all([builder.getRawMany(), totalCountBuilder.getCount()]);

    return PaginatedViewDto.mapToView({
      items: questions,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  private applyQuestionFilters(
    builder: SelectQueryBuilder<Questions>,
    bodySearchTerm: string | null,
    publishedStatus: QuestionsPublishStatus,
  ) {
    if (bodySearchTerm) {
      builder.andWhere(`question.body ILIKE :body`, {
        body: `%${bodySearchTerm}%`,
      });
    }

    if (publishedStatus !== QuestionsPublishStatus.All) {
      builder.andWhere(`question.published = :published`, {
        published: publishedStatus === QuestionsPublishStatus.Published,
      });
    }

    return builder;
  }
}
