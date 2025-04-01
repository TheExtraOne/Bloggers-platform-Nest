import { Users } from '../../../../user-accounts/users/domain/entities/user.entity';
import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Posts } from '../../../posts/domain/entities/post.entity';

/**
 * Entity representing comments in the blogging platform
 * @extends BaseTimestampedEntity
 */
@Entity()
export class Comments extends BaseTimestampedEntity {
  /**
   * Unique identifier for the comment
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  /**
   * The content of the comment
   * @type {string}
   */
  @Column({ type: 'varchar', length: 300, nullable: false })
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
}
