import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { BaseWithId } from '../../../../../core/base-classes/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LikeStatus } from '../enums/like-status.enum';
import { Comments } from '../../../comments/domain/entities/comment.entity';

@Entity()
export class CommentLikes extends BaseWithId {
  /**
   * The status of the like for the comment
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
  @ManyToOne(() => Users, (users) => users.commentLikes)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  /**
   * Post that this comment belongs to
   * @type {Comments}
   */
  @ManyToOne(() => Comments, (comments) => comments.commentLikes)
  @JoinColumn({ name: 'comment_id' })
  comment: Comments;
}
