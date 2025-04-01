import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { EntityType } from './update-like-status.use-case';
import { LikeableEntity } from './enrich-entity-with-like.use-case';
import { LikeStatus } from '../../domain/enums/like-status.enum';

export class EnrichEntitiesWithLikesCommand<
  T extends LikeableEntity,
> extends Command<PaginatedViewDto<T[]>> {
  constructor(
    public readonly entities: PaginatedViewDto<T[]>,
    public readonly userId: string | null,
    public readonly entityType: EntityType,
  ) {
    super();
  }
}

@CommandHandler(EnrichEntitiesWithLikesCommand)
export class EnrichEntitiesWithLikesUseCase<T extends LikeableEntity>
  implements
    ICommandHandler<EnrichEntitiesWithLikesCommand<T>, PaginatedViewDto<T[]>>
{
  constructor(private readonly pgLikesRepository: PgLikesRepository) {}

  async execute(
    command: EnrichEntitiesWithLikesCommand<T>,
  ): Promise<PaginatedViewDto<T[]>> {
    const { entities, userId, entityType } = command;

    // If there's no jwt - returning default (NONE) status
    if (!entities || !userId) {
      return entities;
    }

    // Get all user's likes for passed parentIds
    const parentIds = entities.items.map((entity) => entity.id);

    const userLikes =
      await this.pgLikesRepository.findLikesByAuthorIdAndParentIdArray(
        userId,
        parentIds,
      );

    let userLikesObject = {};
    if (userLikes.length) {
      // Object instead of array with userLikes. A key will be parentId and value will be LikeStatus. O (1)
      userLikesObject = (
        userLikes as {
          id: number;
          user_id: string;
          parent_id: string;
          created_at: Date;
          updated_at: Date;
          parent_type: EntityType;
          like_status: LikeStatus;
        }[]
      ).reduce(
        (acc, like) => {
          acc[like.parent_id] = like.like_status;
          return acc;
        },
        {} as Record<string, LikeStatus>,
      );
    }

    // Add user's like status to each entity
    return {
      ...entities,
      items: entities.items.map((entity) => {
        const like = userLikesObject[entity.id];
        const myStatus = like ? (like as LikeStatus) : LikeStatus.None;

        // Handle both regular and extended likes info
        if (entityType === EntityType.Comment) {
          return {
            ...entity,
            likesInfo: {
              ...entity.likesInfo,
              myStatus,
            },
          };
        } else {
          return {
            ...entity,
            extendedLikesInfo: {
              ...entity.extendedLikesInfo,
              myStatus,
            },
          };
        }
      }),
    };
  }
}
