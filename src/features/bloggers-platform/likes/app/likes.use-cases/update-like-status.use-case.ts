import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { PgCommentsRepository } from '../../../comments/infrastructure/pg.comments.repository';
import { PgPostsRepository } from '../../../posts/infrastructure/pg.posts.repository';
import { TPgPost } from '../../../posts/infrastructure/query/pg.posts.query-repository';
import { PgUsersRepository } from '../../../../user-accounts/users/infrastructure/pg.users.repository';
import { PgLikesRepository } from '../../infrastructure/pg.likes.repository';
import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../../../constants';
import { LikeStatus } from '../../domain/like.entity';

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
    private readonly pgUsersRepository: PgUsersRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<void> {
    const { parentId, entityType, userId, updateLikeStatusDto } = command;
    // Check if comment or post exists
    await this.validateParentId(parentId, entityType);

    // Check if user exists
    // TODO: do we need a login?
    const user: {
      userId: string;
      login: string;
    } = await this.validateAndGetUser(userId);

    // Check if like already exists
    const existingLike: {
      likeId: string;
      status: LikeStatus;
    } | null = await this.pgLikesRepository.findLikeByAuthorIdAndParentId(
      user.userId,
      parentId,
      entityType,
    );

    if (existingLike) {
      await this.handleExistingLike(
        existingLike,
        updateLikeStatusDto.likeStatus,
        parentId,
        entityType,
      );
    } else {
      await this.handleNewLike(
        user.userId,
        parentId,
        updateLikeStatusDto,
        entityType,
      );
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
    login: string;
  }> {
    const user: {
      userId: string;
      login: string;
    } | null = await this.pgUsersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  private async handleExistingLike(
    like: { likeId: string; status: LikeStatus },
    newStatus: LikeStatus,
    parentId: string,
    entityType: EntityType,
  ): Promise<void> {
    if (like.status === newStatus) {
      return;
    }

    await this.pgLikesRepository.updateLikeStatus(like.likeId, newStatus);
    await this.updateLikesAmount({ parentId, entityType });

    // TODO: post update
    // if (post) {
    //   await this.updateNewestLikes({ parentId, post });
    // }
  }

  private async handleNewLike(
    userId: string,
    parentId: string,
    updateLikeStatusDto: UpdateLikeStatusInputDto,
    entityType: EntityType,
  ): Promise<void> {
    await this.pgLikesRepository.createLike({
      userId,
      parentId,
      status: updateLikeStatusDto.likeStatus,
      parentType: entityType,
    });

    // Updating amount of likes/dislikes in parent entity
    await this.updateLikesAmount({ parentId, entityType });

    if (entityType === EntityType.Post) {
      // TODO: implement newest likes update for Post
      // await this.updateNewestLikes({ parentId, post });
    }
  }

  private async updateLikesAmount({
    parentId,
    entityType,
  }: {
    parentId: string;
    entityType: EntityType;
  }): Promise<void> {
    const { likesCount, dislikesCount } =
      await this.pgLikesRepository.getLikesAndDislikesCount(parentId);

    if (entityType === EntityType.Comment) {
      await this.pgCommentsRepository.updateLikesCount({
        commentId: parentId,
        likesCount,
        dislikesCount,
      });
    }
    // TODO: post update
    // if (entityType === EntityType.Post) {
    //   post.updateLikesCount(likesCount);
    //   post.updateDislikesCount(dislikesCount);
    //   await this.postsRepository.save(post);
    // }
  }

  // private async updateNewestLikes({
  //   parentId,
  //   post,
  // }: {
  //   parentId: string;
  //   post: PostDocument;
  // }) {
  //   const likes = await this.mgLikesRepository.getLikesByParentIdWithDateSort({
  //     parentId,
  //   });

  //   if (!likes.length) {
  //     post.updateNewestLikes([]);

  //     await this.postsRepository.save(post);
  //     return;
  //   }

  //   // Finding 3 latest likes
  //   post.updateNewestLikes(likes.slice(0, 3));

  //   await this.postsRepository.save(post);
  // }
}
