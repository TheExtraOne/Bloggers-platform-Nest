import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { PgCommentsRepository } from '../../../comments/infrastructure/pg.comments.repository';
import { PgPostsRepository } from '../../../posts/infrastructure/pg.posts.repository';
import { PgExternalUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.external.users.repository';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { EntityType } from '../../domain/enums/entity-type.enum';
import { CommentLikes } from '../../domain/entities/comment-like.entity';
import { PostLikes } from '../../domain/entities/post-like.entity';
import { Comments } from '../../../comments/domain/entities/comment.entity';
import { Posts } from '../../../posts/domain/entities/post.entity';
import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';

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
    const parent: Comments | Posts = await this.validateParentId(
      parentId,
      entityType,
    );

    // Check if user exists
    const user: Users = await this.pgUsersRepository.findUserOrThrow(userId);

    // Check if like already exists
    const existingLike: CommentLikes | PostLikes | null =
      await this.pgLikesRepository.findLikeByAuthorIdAndParentId(
        userId,
        parentId,
        entityType,
      );

    if (existingLike) {
      if (existingLike.likeStatus === updateLikeStatusDto.likeStatus) {
        return;
      }

      await this.pgLikesRepository.updateLikeStatus(
        existingLike,
        updateLikeStatusDto.likeStatus,
        entityType,
      );
    } else {
      await this.pgLikesRepository.createLike({
        user,
        parent,
        status: updateLikeStatusDto.likeStatus,
        entityType,
      });
    }
  }

  private async validateParentId(
    parentId: string,
    entityType: EntityType,
  ): Promise<Comments | Posts> {
    if (entityType !== EntityType.Comment && entityType !== EntityType.Post) {
      throw new Error('Entity type must be either "comment" or "post"');
    }

    if (entityType === EntityType.Comment) {
      return await this.pgCommentsRepository.findCommentByIdOrThrow(parentId);
    } else {
      return await this.pgPostsRepository.findPostByIdOrThrow(parentId);
    }
  }
}
