import { Blogs } from '../../../blogs/domain/entities/blog.entity';
import { BaseWithId } from '../../../../../core/base-classes/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Comments } from '../../../comments/domain/entities/comment.entity';
import { PostLikes } from '../../../likes/domain/entities/post-like.entity';

export const POSTS_CONSTRAINTS = {
  MAX_CONTENT_LENGTH: 1000,
  MAX_TITLE_LENGTH: 30,
  MAX_SHORT_DESCRIPTION_LENGTH: 100,
};

/**
 * Entity representing a blog post in the system.
 * @extends BaseTimestampedEntity
 */
@Entity()
export class Posts extends BaseWithId {
  /**
   * Title of the post
   * @type {string}
   * @maxLength 30
   */
  @Column({
    type: 'varchar',
    length: POSTS_CONSTRAINTS.MAX_TITLE_LENGTH,
    nullable: false,
  })
  public title: string;

  /**
   * Brief description of the post content
   * @type {string}
   * @maxLength 100
   */
  @Column({
    type: 'varchar',
    length: POSTS_CONSTRAINTS.MAX_SHORT_DESCRIPTION_LENGTH,
    nullable: false,
  })
  public shortDescription: string;

  /**
   * Main content of the post
   * @type {string}
   * @maxLength 1000
   */
  @Column({
    type: 'varchar',
    length: POSTS_CONSTRAINTS.MAX_CONTENT_LENGTH,
    nullable: false,
  })
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

  /**
   * Collection of likes associated with this post
   * @type {PostLikes[]}
   */
  @OneToMany(() => PostLikes, (postLikes) => postLikes.post)
  postLikes: PostLikes[];
}
