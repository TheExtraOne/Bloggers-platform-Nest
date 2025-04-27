import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { BaseWithId } from '../../../../../core/base-classes/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Posts } from '../../../posts/domain/entities/post.entity';
import { CommentLikes } from '../../../likes/domain/entities/comment-like.entity';

export const COMMENTS_CONSTRAINTS = {
  MAX_CONTENT_LENGTH: 300,
  MIN_CONTENT_LENGTH: 20,
};

/**
 * Entity representing comments in the blogging platform
 * @extends BaseWithId
 */
@Entity()
export class Comments extends BaseWithId {
  /**
   * The content of the comment
   * @type {string}
   */
  @Column({
    type: 'varchar',
    length: COMMENTS_CONSTRAINTS.MAX_CONTENT_LENGTH,
    nullable: false,
  })
  public content: string;

  /**
   * User who created the comment
   * @type {Users}
   */
  @ManyToOne(() => Users, (users) => users.comments)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  /**
   * Post that this comment belongs to
   * @type {Posts}
   */
  @ManyToOne(() => Posts, (posts) => posts.comments)
  @JoinColumn({ name: 'post_id' })
  post: Posts;

  /**
   * Collection of likes associated with this comment
   * @type {CommentLikes[]}
   */
  @OneToMany(() => CommentLikes, (commentLikes) => commentLikes.comment)
  commentLikes: CommentLikes[];
}
