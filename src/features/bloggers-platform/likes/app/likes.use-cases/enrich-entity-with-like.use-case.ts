import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityType } from './update-like-status.use-case';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { LikeStatus } from '../../../likes/infrastructure/pg.likes.repository';

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

    const like = await this.pgLikesRepository.findLikeByAuthorIdAndParentId(
      userId,
      entity.id,
    );

    const myStatus = like ? (like.status as LikeStatus) : LikeStatus.None;

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
