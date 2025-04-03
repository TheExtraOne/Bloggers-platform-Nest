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

    const commentWithStats = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoin('comment.commentLikes', 'comment_likes')
      .addSelect([
        `SUM(CASE WHEN comment_likes.likeStatus = 'Like' THEN 1 ELSE 0 END) AS "likesCount"`,
        `SUM(CASE WHEN comment_likes.likeStatus = 'Dislike' THEN 1 ELSE 0 END) AS "dislikesCount"`,
      ])
      .where('comment.id = :commentId', { commentId: +commentId })
      .groupBy('comment.id')
      .addGroupBy('user.id')
      .getRawAndEntities();

    const comment = commentWithStats.entities[0];
    if (!comment) throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);

    const raw = commentWithStats.raw[0];
    const likesCount = Number(raw.likesCount ?? '0');
    const dislikesCount = Number(raw.dislikesCount ?? '0');

    return PgCommentsViewDto.mapToView({
      ...comment,
      likesCount,
      dislikesCount,
    });
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

    const result = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoin('comment.commentLikes', 'likes')
      .addSelect([
        `SUM(CASE WHEN likes.likeStatus = 'Like' THEN 1 ELSE 0 END) AS "likesCount"`,
        `SUM(CASE WHEN likes.likeStatus = 'Dislike' THEN 1 ELSE 0 END) AS "dislikesCount"`,
      ])
      .where('comment.post.id = :postId', { postId: post.id })
      .groupBy('comment.id')
      .addGroupBy('post.id')
      .addGroupBy('user.id')
      .orderBy(`comment.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit)
      .getRawAndEntities();

    const comments = result.entities;
    const rawStats = result.raw;

    const totalCount = await this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.post.id = :postId', { postId: post.id })
      .getCount();

    // Merge like/dislike counts
    const commentsWithStats = comments.map((comment, idx) => ({
      ...comment,
      likesCount: Number(rawStats[idx]?.likesCount ?? 0),
      dislikesCount: Number(rawStats[idx]?.dislikesCount ?? 0),
    }));

    const items = commentsWithStats.map((comment) =>
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
