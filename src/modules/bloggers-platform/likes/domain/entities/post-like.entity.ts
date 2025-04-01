import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { BaseWithId } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Posts } from '../../../posts/domain/entities/post.entity';
import { LikeStatus } from '../enums/like-status.enum';

@Entity()
export class PostLikes extends BaseWithId {
  /**
   * The status of the like for the post
   * @type {LikeStatus}
   * @default LikeStatus.None
   */
  @Column({
    type: 'enum',
    enum: LikeStatus,
    default: LikeStatus.None,
    nullable: true,
  })
  public likeStatus: string;

  /**
   * User who created the comment
   * @type {Users}
   */
  @ManyToOne(() => Users, (users) => users.postLikes)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  /**
   * Post that this comment belongs to
   * @type {Posts}
   */
  @ManyToOne(() => Posts, (posts) => posts.postLikes)
  @JoinColumn({ name: 'post_id' })
  post: Posts;
}
