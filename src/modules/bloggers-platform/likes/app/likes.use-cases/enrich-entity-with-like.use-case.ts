import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { LikeStatus } from '../../domain/enums/like-status.enum';
import { EntityType } from '../../domain/enums/entity-type.enum';
import { CommentLikes } from '../../domain/entities/comment-like.entity';
import { PostLikes } from '../../domain/entities/post-like.entity';

export interface LikeableEntity {
  id: string;
  likesInfo?: {
    myStatus: LikeStatus;
  };
  extendedLikesInfo?: {
    myStatus: LikeStatus;
  };
}

export class EnrichEntityWithLikeCommand<
  T extends LikeableEntity | null,
> extends Command<T> {
  constructor(
    public readonly entity: T,
    public readonly userId: string | null,
    public readonly entityType: EntityType,
  ) {
    super();
  }
}

@CommandHandler(EnrichEntityWithLikeCommand)
export class EnrichEntityWithLikeUseCase<T extends LikeableEntity>
  implements ICommandHandler<EnrichEntityWithLikeCommand<T>, T>
{
  constructor(private readonly pgLikesRepository: PgLikesRepository) {}

  async execute(command: EnrichEntityWithLikeCommand<T>): Promise<T> {
    const { entity, userId, entityType } = command;

    // If there's no jwt - returning default (NONE) status
    if (!entity || !userId) {
      return entity;
    }

    const like: CommentLikes | null | PostLikes =
      await this.pgLikesRepository.findLikeByAuthorIdAndParentId(
        userId,
        entity.id,
        entityType,
      );

    const myStatus = like ? (like.likeStatus as LikeStatus) : LikeStatus.None;

    // Handle both regular and extended likes info
    if (entityType === EntityType.Comment) {
      return {
        ...entity,
        likesInfo: {
          ...entity.likesInfo,
          myStatus,
        },
      };
    }
    if (entityType === EntityType.Post) {
      return {
        ...entity,
        extendedLikesInfo: {
          ...entity.extendedLikesInfo,
          myStatus,
        },
      };
    }
    return entity;
  }
}
