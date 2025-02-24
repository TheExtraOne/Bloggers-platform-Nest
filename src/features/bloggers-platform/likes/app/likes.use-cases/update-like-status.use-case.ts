import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { Like, LikeDocument, LikeModelType } from '../../domain/like.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CommentDocument } from '../../../comments/domain/comment.entity';
import { PostDocument } from '../../../posts/domain/post.entity';
import { UsersRepository } from '../../../../user-accounts/users/infrastructure/users.repository';

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
    @InjectModel(Like.name) private LikeModel: LikeModelType,
    private readonly likesRepository: LikesRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<void> {
    const { parentId, entityType, userId, updateLikeStatusDto } = command;

    const { comment, post } = await this.validateAndGetEntity(
      parentId,
      entityType,
    );
    const user = await this.validateAndGetUser(userId);

    const existingLike =
      await this.likesRepository.findLikeByAuthorIdAndParentId(
        userId,
        parentId,
      );

    if (existingLike) {
      await this.handleExistingLike(
        existingLike,
        updateLikeStatusDto,
        parentId,
        comment,
        post,
      );
    } else {
      await this.handleNewLike(
        user,
        parentId,
        updateLikeStatusDto,
        comment,
        post,
      );
    }
  }

  private async validateAndGetEntity(
    parentId: string,
    entityType: EntityType,
  ): Promise<{
    comment: CommentDocument | null;
    post: PostDocument | null;
  }> {
    if (entityType !== EntityType.Comment && entityType !== EntityType.Post) {
      throw new Error('Entity type must be either "comment" or "post"');
    }

    let comment: CommentDocument | null = null;
    let post: PostDocument | null = null;

    if (entityType === EntityType.Comment) {
      comment = await this.commentsRepository.findCommentById(parentId);
      if (!comment) {
        throw new Error('Comment not found');
      }
    } else {
      post = await this.postsRepository.findPostById(parentId);
      if (!post) {
        throw new Error('Post not found');
      }
    }

    return { comment, post };
  }

  private async validateAndGetUser(userId: string) {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  private async handleExistingLike(
    like: LikeDocument,
    updateLikeStatusDto: UpdateLikeStatusInputDto,
    parentId: string,
    comment: CommentDocument | null,
    post: PostDocument | null,
  ): Promise<void> {
    if (like.status === updateLikeStatusDto.likeStatus) {
      return;
    }

    like.update({ status: updateLikeStatusDto.likeStatus });
    await this.likesRepository.save(like);
    await this.updateLikesAmount({ parentId, comment, post });

    if (post) {
      await this.updateNewestLikes({ parentId, post });
    }
  }

  private async handleNewLike(
    user: any,
    parentId: string,
    updateLikeStatusDto: UpdateLikeStatusInputDto,
    comment: CommentDocument | null,
    post: PostDocument | null,
  ): Promise<void> {
    const newLike = this.LikeModel.createInstance({
      login: user.login,
      userId: user.id,
      parentId,
      status: updateLikeStatusDto.likeStatus,
    });

    await this.likesRepository.save(newLike);
    await this.updateLikesAmount({ parentId, comment, post });

    if (post) {
      await this.updateNewestLikes({ parentId, post });
    }
  }

  private async updateLikesAmount({
    parentId,
    comment,
    post,
  }: {
    parentId: string;
    comment: CommentDocument | null;
    post: PostDocument | null;
  }): Promise<void> {
    const { likesCount, dislikesCount } =
      await this.likesRepository.getLikesAndDislikesCount(parentId);

    if (comment) {
      comment.updateLikesCount(likesCount);
      comment.updateDislikesCount(dislikesCount);
      await this.commentsRepository.save(comment);
    }

    if (post) {
      post.updateLikesCount(likesCount);
      post.updateDislikesCount(dislikesCount);
      await this.postsRepository.save(post);
    }
  }

  private async updateNewestLikes({
    parentId,
    post,
  }: {
    parentId: string;
    post: PostDocument;
  }) {
    const likes = await this.likesRepository.getLikesByParentIdWithDateSort({
      parentId,
    });

    if (!likes.length) {
      post.updateNewestLikes([]);

      await this.postsRepository.save(post);
      return;
    }

    // Finding 3 latest likes
    post.updateNewestLikes(likes.slice(0, 3));

    await this.postsRepository.save(post);
  }
}
