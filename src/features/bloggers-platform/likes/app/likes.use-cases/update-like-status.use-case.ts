import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLikeStatusInputDto } from '../../api/input-dto/update-like-input.dto';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { Like, LikeModelType } from '../../domain/like.entity';
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
    const like = await this.likesRepository.findLikeByUserIdAndParentId(
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
        userId,
        login: user.login,
      });

      return;
    }

    // If there is no like, then creating new like
    const newLike = this.LikeModel.createInstance({
      authorLogin: user.login,
      authorId: userId,
      parentId,
      status: updateLikeStatusDto.likeStatus,
    });

    await this.likesRepository.save(newLike);
    await this.updateLikesAmount({
      parentId,
      comment,
      post,
      userId,
      login: user.login,
    });
  }

  private async updateLikesAmount({
    parentId,
    comment,
    post,
    userId,
    login,
  }: {
    parentId: string;
    comment: CommentDocument | null;
    post: PostDocument | null;
    userId: string;
    login: string;
  }) {
    // TODO: refactor, make one call for getting likes and dislikes
    // Count likes and dislikes for the entity
    const likes = await this.likesRepository.findLikesByParentId(parentId);
    const dislikes =
      await this.likesRepository.findDislikesByParentId(parentId);
    const amountOfLikes = likes.length;
    const amountOfDislikes = dislikes.length;
    console.log(amountOfLikes, amountOfDislikes);

    // Update amount of likes for the entity
    if (comment) {
      console.log('HI');
      comment.updateLikesCount(amountOfLikes);
      comment.updateDislikesCount(amountOfDislikes);

      await this.commentsRepository.save(comment!);
    }
    if (post) {
      post.updateLikesCount(amountOfLikes);
      post.updateDislikesCount(amountOfDislikes);
      post.updateNewestLikes({ userId, login, addedAt: new Date() });
      await this.postsRepository.save(post!);
    }
  }
}
