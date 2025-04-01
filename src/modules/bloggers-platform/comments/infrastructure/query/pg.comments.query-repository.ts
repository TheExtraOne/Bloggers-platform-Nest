import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { Repository } from 'typeorm';
import { PgCommentsViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgPostsQueryRepository } from '../../../posts/infrastructure/query/pg.posts.query-repository';
import { ERRORS } from '../../../../../constants';
import { Comments } from '../../domain/entities/comment.entity';

@Injectable()
export class PgCommentsQueryRepository extends PgBaseRepository {
  private allowedColumns = ['content', 'created_at'];

  constructor(
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
    @InjectRepository(Comments)
    private readonly commentsRepository: Repository<Comments>,
  ) {
    super();
  }

  async findCommentById(commentId: string): Promise<PgCommentsViewDto> {
    if (!this.isCorrectNumber(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const comment = await this.commentsRepository.findOne({
      where: {
        id: +commentId,
      },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    return PgCommentsViewDto.mapToView(comment);
  }

  async findAllCommentsForPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<PgCommentsViewDto[]>> {
    // check that post exists inside
    const post = await this.pgPostsQueryRepository.findPostById(postId);

    const { pageNumber, pageSize, sortDirection, sortBy } = query;
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);
    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';

    const [comments, totalCount] = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.post.id = :postId', { postId: post.id })
      .orderBy(`comment.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const items = comments.map((comment) =>
      PgCommentsViewDto.mapToView(comment),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
