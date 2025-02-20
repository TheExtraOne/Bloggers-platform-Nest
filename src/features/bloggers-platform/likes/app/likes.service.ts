import { Injectable } from '@nestjs/common';
import { LikesRepository } from '../infrastructure/likes.repository';
import { LikeStatus } from '../domain/like.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';

interface LikeableEntity {
  id: string;
  likesInfo?: {
    myStatus: LikeStatus;
  };
  extendedLikesInfo?: {
    myStatus: LikeStatus;
  };
}

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async enrichSingleEntityWithLikeStatus<T extends LikeableEntity>(
    entity: T,
    userId: string | null,
  ): Promise<T> {
    // If there's no jwt - returning default (NONE) status
    if (!userId) return entity;

    const like = await this.likesRepository.findLikeByAuthorIdAndParentId(
      userId,
      entity.id,
    );

    const myStatus = like ? (like.status as LikeStatus) : LikeStatus.None;

    // Handle both regular and extended likes info
    if ('likesInfo' in entity) {
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
  }

  async enrichMultipleEntitiesWithLikeStatus<T extends LikeableEntity>(
    paginatedEntities: PaginatedViewDto<T[]>,
    userId: string | null,
  ): Promise<PaginatedViewDto<T[]>> {
    // If there's no jwt - returning default (NONE) status
    if (!userId) return paginatedEntities;

    // Get all user's likes
    const userLikes = await this.likesRepository.findAllLikesByAuthorId(userId);

    // Add user's like status to each entity
    return {
      ...paginatedEntities,
      items: paginatedEntities.items.map((entity) => {
        const like = userLikes?.find((like) => like.parentId === entity.id);
        const myStatus = like ? (like.status as LikeStatus) : LikeStatus.None;

        // Handle both regular and extended likes info
        if ('likesInfo' in entity) {
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
