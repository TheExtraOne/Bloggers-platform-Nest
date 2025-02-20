import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { Like, LikeModelType, LikeStatus } from '../../domain/like.entity';
import { UsersRepository } from 'src/features/user-accounts/infrastructure/users.repository';
import { InjectModel } from '@nestjs/mongoose';
import { CommentDocument } from 'src/features/bloggers-platform/comments/domain/comment.entity';
import { PostDocument } from 'src/features/bloggers-platform/posts/domain/post.entity';

export class UpdateLikeStatusCommand {
  constructor(
    public readonly parentId: string,
    public readonly userId: string,
    public readonly updateLikeStatusDto: UpdateLikeStatusInputDto,
    public readonly entityType: 'comment' | 'post',
  ) {}
}

// TODO: refactor, make methods smaller
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
    let comment: CommentDocument | null = null;
    let post: PostDocument | null = null;

    // Check if there is such comment or post
    if (entityType !== 'comment' && entityType !== 'post') {
      throw new Error('Entity type must be either "comment" or "post"');
    }
    if (entityType === 'comment') {
      comment = await this.commentsRepository.findCommentById(parentId);
    }
    if (entityType === 'post') {
      post = await this.postsRepository.findPostById(parentId);
    }

    const user = await this.usersRepository.findUserById(userId);
    // Check if user already liked the entity
    const like = await this.likesRepository.findLikeByAuthorIdAndParentId(
      userId,
      parentId,
    );

    // If there is like, then updating status
    if (like) {
      // if the status hasn't changed, then returning
      if (like.status === updateLikeStatusDto.likeStatus) {
        return;
      }

      like.update({ status: updateLikeStatusDto.likeStatus });
      await this.likesRepository.save(like);
      await this.updateLikesAmount({
        parentId,
        comment,
        post,
      });

      if (post) await this.updateNewestLikes({ parentId, post });

      return;
    }

    // If there is no like, then creating new like
    const newLike = this.LikeModel.createInstance({
      login: user.login,
      userId: userId,
      parentId,
      status: updateLikeStatusDto.likeStatus,
    });

    await this.likesRepository.save(newLike);
    await this.updateLikesAmount({
      parentId,
      comment,
      post,
    });
    if (post) await this.updateNewestLikes({ parentId, post });
  }

  private async updateLikesAmount({
    parentId,
    comment,
    post,
  }: {
    parentId: string;
    comment: CommentDocument | null;
    post: PostDocument | null;
  }) {
    // TODO: refactor, make one call for getting likes and dislikes
    // Count likes and dislikes for the entity
    const likes = await this.likesRepository.findLikesByParentId(parentId);
    const dislikes =
      await this.likesRepository.findDislikesByParentId(parentId);
    const amountOfLikes = likes.length;
    const amountOfDislikes = dislikes.length;

    // Update amount of likes for the entity
    if (comment) {
      comment.updateLikesCount(amountOfLikes);
      comment.updateDislikesCount(amountOfDislikes);

      await this.commentsRepository.save(comment!);
    }
    if (post) {
      post.updateLikesCount(amountOfLikes);
      post.updateDislikesCount(amountOfDislikes);

      await this.postsRepository.save(post!);
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
