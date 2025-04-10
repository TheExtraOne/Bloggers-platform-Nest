import { BaseWithId } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { UsersEmailConfirmation } from './email.confirmation.entity';
import { UsersPasswordRecovery } from './password.recovery.entity';
import { Sessions } from '../../../sessions/domain/entities/session.entity';
import { Comments } from '../../../../bloggers-platform/comments/domain/entities/comment.entity';
import { PostLikes } from '../../../../bloggers-platform/likes/domain/entities/post-like.entity';
import { CommentLikes } from '../../../../bloggers-platform/likes/domain/entities/comment-like.entity';

export const USERS_CONSTRAINTS = {
  MAX_LOGIN_LENGTH: 10,
  MIN_LOGIN_LENGTH: 3,
  MAX_EMAIL_LENGTH: 30,
  MAX_PASSWORD_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 6,
};

/**
 * Entity representing a user in the system.
 * Extends BaseWithId to inherit common fields like id and timestamps.
 */
@Entity()
export class Users extends BaseWithId {
  /**
   * User's login name.
   * Must be unique and cannot be null.
   * Maximum length is 10 characters.
   */
  @Column({
    unique: true,
    type: 'varchar',
    length: USERS_CONSTRAINTS.MAX_LOGIN_LENGTH,
    nullable: false,
  })
  public login: string;

  /**
   * User's email address.
   * Must be unique and cannot be null.
   * Maximum length is 30 characters.
   */
  @Index('userEmail', { unique: true })
  @Column({
    unique: true,
    type: 'varchar',
    length: USERS_CONSTRAINTS.MAX_EMAIL_LENGTH,
    nullable: false,
  })
  public email: string;

  /**
   * Hashed password of the user.
   * Cannot be null.
   */
  @Column({ nullable: false })
  public passwordHash: string;

  /**
   * One-to-one relationship with email confirmation details.
   * When user is deleted, related email confirmation will be deleted (CASCADE).
   * Updates and removals are cascaded to the email confirmation entity.
   */
  @OneToOne(
    () => UsersEmailConfirmation,
    (emailConfirmation) => emailConfirmation.user,
    {
      onDelete: 'CASCADE',
      cascade: true,
    },
  )
  emailConfirmation: UsersEmailConfirmation;

  /**
   * One-to-one relationship with password recovery details.
   * When user is deleted, related password recovery will be deleted (CASCADE).
   * Updates and removals are cascaded to the password recovery entity.
   */
  @OneToOne(
    () => UsersPasswordRecovery,
    (passwordRecovery) => passwordRecovery.user,
    {
      onDelete: 'CASCADE',
      cascade: true,
    },
  )
  passwordRecovery: UsersPasswordRecovery;

  /**
   * Collection of user's active sessions
   * @type {Sessions[]}
   */
  @OneToMany(() => Sessions, (sessions) => sessions.user)
  sessions: Sessions[];

  /**
   * Collection of comments created by the user
   * @type {Comments[]}
   */
  @OneToMany(() => Comments, (comments) => comments.user)
  comments: Comments[];

  /**
   * Collection of likes created by the user
   * @type {PostLikes[]}
   */
  @OneToMany(() => PostLikes, (postLikes) => postLikes.user)
  postLikes: PostLikes[];

  /**
   * Collection of likes created by the user
   * @type {CommentLikes[]}
   */
  @OneToMany(() => CommentLikes, (commentLikes) => commentLikes.user)
  commentLikes: CommentLikes[];
}
