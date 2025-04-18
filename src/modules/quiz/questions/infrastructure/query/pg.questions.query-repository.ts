import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { ERRORS } from 'src/constants';
import { Questions } from '../../domain/question.entity';
import { PGQuestionViewDto } from '../../api/view-dto/question.view-dto';

@Injectable()
export class PgQuestionsQueryRepository extends PgBaseRepository {
  // private readonly allowedColumns = [
  //   'created_at',
  //   'question',
  //   'description',
  //   'website_url',
  // ] as const;

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

  // TODO: implement
  // async findAll(
  //   query: GetBlogsQueryParams,
  // ): Promise<PaginatedViewDto<PgBlogsViewDto[]>> {
  //   const { sortBy, sortDirection, searchNameTerm, pageNumber, pageSize } =
  //     query;

  //   const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
  //   const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
  //   const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
  //     | 'ASC'
  //     | 'DESC';

  //   // Used query builder in order to avoid extra mapping
  //   const builder = this.blogsRepository
  //     .createQueryBuilder('blog')
  //     .select([
  //       'blog.id::text AS id', // cast to text, alias as `id`
  //       'blog.name AS name',
  //       'blog.description AS description',
  //       'blog.websiteUrl AS "websiteUrl"',
  //       'blog.createdAt AS "createdAt"',
  //       'blog.isMembership AS "isMembership"',
  //     ])
  //     .orderBy(`blog.${sortColumn}`, upperCaseSortDirection)
  //     .offset(offset)
  //     .limit(limit);

  //   if (searchNameTerm) {
  //     builder.where('blog.name ILIKE :name', { name: `%${searchNameTerm}%` });
  //   }

  //   const totalCountBuilder =
  //     this.blogsRepository.createQueryBuilder('blogCount');

  //   if (searchNameTerm) {
  //     totalCountBuilder.where('blogCount.name ILIKE :name', {
  //       name: `%${searchNameTerm}%`,
  //     });
  //   }

  //   const [blogs, totalCount]: [PgBlogsViewDto[], number] = await Promise.all([
  //     builder.getRawMany(),
  //     totalCountBuilder.getCount(),
  //   ]);

  //   return PaginatedViewDto.mapToView({
  //     items: blogs,
  //     totalCount,
  //     page: pageNumber,
  //     size: pageSize,
  //   });
  // }
}
