import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { PgCommentsRepository } from '../../../comments/infrastructure/pg.comments.repository';
import { PgPostsRepository } from '../../../posts/infrastructure/pg.posts.repository';
import { TPgPost } from '../../../posts/infrastructure/query/pg.posts.query-repository';
import { PgExternalUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';
import { LikeStatus } from '../../infrastructure/pg.likes.repository';
import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';

export enum EntityType {
  Comment = 'comment',
  Post = 'post',
}

export class UpdateLikeStatusCommand extends Command<void> {
  constructor(
    public readonly parentId: string,
    public readonly userId: string,
    public readonly updateLikeStatusDto: UpdateLikeStatusInputDto,
    public readonly entityType: EntityType,
  ) {
    super();
  }
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase
  implements ICommandHandler<UpdateLikeStatusCommand>
{
  constructor(
    private readonly pgLikesRepository: PgLikesRepository,
    private readonly pgCommentsRepository: PgCommentsRepository,
    private readonly pgPostsRepository: PgPostsRepository,
    private readonly pgUsersRepository: PgExternalUsersRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<void> {
    const { parentId, entityType, userId, updateLikeStatusDto } = command;
    // Check if comment or post exists
    await this.validateParentId(parentId, entityType);

    // Check if user exists
    await this.validateAndGetUser(userId);

    // Check if like already exists
    const existingLike: {
      likeId: string;
      status: LikeStatus;
    } | null = await this.pgLikesRepository.findLikeByAuthorIdAndParentId(
      userId,
      parentId,
    );

    if (existingLike) {
      if (existingLike.status === updateLikeStatusDto.likeStatus) {
        return;
      }

      await this.pgLikesRepository.updateLikeStatus(
        existingLike.likeId,
        updateLikeStatusDto.likeStatus,
      );
    } else {
      await this.pgLikesRepository.createLike({
        userId,
        parentId,
        status: updateLikeStatusDto.likeStatus,
      });
    }
  }

  private async validateParentId(
    parentId: string,
    entityType: EntityType,
  ): Promise<void> {
    if (entityType !== EntityType.Comment && entityType !== EntityType.Post) {
      throw new Error('Entity type must be either "comment" or "post"');
    }

    let comment: { commentId: string; commentatorId: string } | null = null;
    let post: TPgPost | null = null;

    if (entityType === EntityType.Comment) {
      comment = await this.pgCommentsRepository.findCommentById(parentId);
      if (!comment) {
        throw new NotFoundException(ERRORS.COMMENT_NOT_FOUND);
      }
    } else {
      post = await this.pgPostsRepository.findPostById(parentId);
      if (!post) {
        throw new NotFoundException(ERRORS.POST_NOT_FOUND);
      }
    }
  }

  private async validateAndGetUser(userId: string): Promise<{
    userId: string;
  }> {
    const user: Users | null =
      await this.pgUsersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { userId: user.id.toString() };
  }
}
