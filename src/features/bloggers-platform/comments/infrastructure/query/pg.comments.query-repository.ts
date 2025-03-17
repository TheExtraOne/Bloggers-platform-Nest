import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';
import { PgCommentsViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments.query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgPostsQueryRepository } from '../../../posts/infrastructure/query/pg.posts.query-repository';
import { ERRORS } from 'src/constants';

export type TPgComment = {
  id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  likes_count: number;
  dislikes_count: number;
  commentator_id: string;
  commentator_login: string;
};

@Injectable()
export class PgCommentsQueryRepository extends PgBaseRepository {
  private allowedColumns = ['content', 'created_at'];

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly pgPostsQueryRepository: PgPostsQueryRepository,
  ) {
    super();
  }

  async findCommentById(commentId: string): Promise<PgCommentsViewDto | null> {
    if (!this.isCorrectNumber(commentId)) {
      throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
    }

    const query = `
      SELECT comments.*, users.login as commentator_login, likes.likes_count, likes.dislikes_count
      FROM public.comments as comments
      LEFT JOIN public.users as users
      ON comments.commentator_id = users.id
      LEFT JOIN public.comments_likes_information as likes
      ON comments.id = likes.comment_id
      WHERE comments.id = $1
      AND comments.deleted_at IS NULL
    `;
    const params = [commentId];
    const result = await this.dataSource.query(query, params);

    return result[0] ? PgCommentsViewDto.mapToView(result[0]) : null;
  }

  async findAllCommentsForPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<PgCommentsViewDto[]>> {
    // check that post exists
    const post = await this.pgPostsQueryRepository.findPostById(postId);
    if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    const { pageNumber, pageSize, sortDirection, sortBy } = query;

    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const [comments, totalCount] = await Promise.all([
      this.findCommentsByPostId(
        postId,
        sortColumn,
        sortDirection,
        limit,
        offset,
      ),
      this.getTotalCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: comments,
      totalCount: +totalCount[0].count,
      page: pageNumber,
      size: pageSize,
    });
  }

  private async getTotalCount(): Promise<[{ count: string }]> {
    return this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM public.comments
      WHERE comments.deleted_at IS NULL
    `,
    );
  }

  async findCommentsByPostId(
    postId: string,
    sortColumn: string,
    sortDirection: string,
    limit: number,
    offset: number,
  ): Promise<PgCommentsViewDto[]> {
    const query = `
      SELECT comments.*, users.login as commentator_login, likes.likes_count, likes.dislikes_count
      FROM public.comments as comments
      LEFT JOIN public.users as users
      ON comments.commentator_id = users.id
      LEFT JOIN public.comments_likes_information as likes
      ON comments.id = likes.comment_id
      WHERE comments.post_id = $1
      AND comments.deleted_at IS NULL
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $2
      OFFSET $3
    `;
    const params = [postId, limit, offset];
    const result: TPgComment[] = await this.dataSource.query(query, params);

    return result.map((comment) => PgCommentsViewDto.mapToView(comment));
  }
}
