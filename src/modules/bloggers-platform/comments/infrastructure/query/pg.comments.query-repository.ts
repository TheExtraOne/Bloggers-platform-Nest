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
import { LikeStatus } from '../../../likes/domain/enums/like-status.enum';

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

    const rawComment: PgCommentsViewDto | undefined =
      await this.commentsRepository
        .createQueryBuilder('comment')
        .select([
          'comment.id::text AS id',
          'comment.content AS content',
          'comment.createdAt AS "createdAt"',
          `json_build_object('userId', (user.id)::text, 'userLogin', user.login) AS "commentatorInfo"`,
          `json_build_object(
        'likesCount', COALESCE(SUM(CASE WHEN comment_likes.likeStatus = 'Like' THEN 1 ELSE 0 END), 0),
        'dislikesCount', COALESCE(SUM(CASE WHEN comment_likes.likeStatus = 'Dislike' THEN 1 ELSE 0 END), 0),
        'myStatus', CAST(:myStatus AS text)
      ) AS "likesInfo"`,
        ])
        .leftJoin('comment.user', 'user')
        .leftJoin('comment.commentLikes', 'comment_likes')
        .where('comment.id = :commentId', { commentId: +commentId })
        .groupBy('comment.id, user.id')
        .setParameter('myStatus', LikeStatus.None)
        .getRawOne();

    if (!rawComment) throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    return rawComment;
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

    const [rawComments, totalCount]: [PgCommentsViewDto[], number] = await Promise.all([
      this.commentsRepository
        .createQueryBuilder('comment')
        .select([
          'comment.id::text AS id',
          'comment.content AS content',
          'comment.createdAt AS "createdAt"',
          `json_build_object('userId', (user.id)::text, 'userLogin', user.login) AS "commentatorInfo"`,
          `json_build_object(
        'likesCount', COALESCE(SUM(CASE WHEN comment_likes.likeStatus = 'Like' THEN 1 ELSE 0 END), 0),
        'dislikesCount', COALESCE(SUM(CASE WHEN comment_likes.likeStatus = 'Dislike' THEN 1 ELSE 0 END), 0),
        'myStatus', CAST(:myStatus AS text)
      ) AS "likesInfo"`,
        ])
        .leftJoin('comment.user', 'user')
        .leftJoin('comment.commentLikes', 'comment_likes')
        .where('comment.post.id = :postId', { postId: +post.id })
        .groupBy('comment.id, user.id')
        .orderBy(`comment.${sortColumn}`, upperCaseSortDirection)
        .offset(offset)
        .limit(limit)
        .setParameter('myStatus', LikeStatus.None)
        .getRawMany(),
      this.commentsRepository
        .createQueryBuilder('comment')
        .where('comment.post.id = :postId', { postId: post.id })
        .getCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: rawComments || [],
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
