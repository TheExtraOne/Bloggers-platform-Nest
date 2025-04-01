import { Blogs } from '../../../blogs/domain/entities/blog.entity';
import { BaseTimestampedEntity } from '../../../../../core/base-entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comments } from '../../../comments/domain/entities/comment.entity';

/**
 * Entity representing a blog post in the system.
 * @extends BaseTimestampedEntity
 */
@Entity()
export class Posts extends BaseTimestampedEntity {
  /**
   * Unique identifier for the post
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  /**
   * Title of the post
   * @type {string}
   * @maxLength 30
   */
  @Column({ type: 'varchar', length: 30, nullable: false })
  public title: string;

  /**
   * Brief description of the post content
   * @type {string}
   * @maxLength 100
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  public shortDescription: string;

  /**
   * Main content of the post
   * @type {string}
   * @maxLength 1000
   */
  @Column({ type: 'varchar', length: 1000, nullable: false })
  public content: string;

  /**
   * Reference to the blog this post belongs to
   * @type {Blogs}
   */
  @ManyToOne(() => Blogs, (blogs) => blogs.posts)
  @JoinColumn({ name: 'blog_id' })
  blog: Blogs;

  /**
   * Collection of comments associated with this post
   * @type {Comments[]}
   */
  @OneToMany(() => Comments, (comments) => comments.post)
  comments: Comments[];
}
