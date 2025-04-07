import { Posts } from '../../../posts/domain/entities/post.entity';
import { BaseWithId } from '../../../../../core/base-entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

export const BLOGS_CONSTRAINTS = {
  MAX_NAME_LENGTH: 15,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_WEBSITE_URL_LENGTH: 100,
};

/**
 * Entity representing a blog in the bloggers platform
 * @extends BaseWithId
 */
@Entity()
export class Blogs extends BaseWithId {
  /**
   * The name of the blog
   * @type {string}
   */
  @Column({ type: 'varchar', length: BLOGS_CONSTRAINTS.MAX_NAME_LENGTH, nullable: false })
  public name: string;

  /**
   * The description of the blog
   * @type {string}
   */
  @Column({ type: 'varchar', length: BLOGS_CONSTRAINTS.MAX_DESCRIPTION_LENGTH, nullable: false })
  public description: string;

  /**
   * The URL of the blog's website
   * @type {string}
   */
  @Column({ type: 'varchar', length: BLOGS_CONSTRAINTS.MAX_WEBSITE_URL_LENGTH, nullable: false })
  public websiteUrl: string;

  /**
   * Indicates if the blog has membership features enabled
   * @type {boolean}
   * @default false
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  public isMembership: boolean;

  /**
   * Collection of posts associated with this blog
   * @type {Posts[]}
   */
  @OneToMany(() => Posts, (posts) => posts.blog)
  posts: Posts[];
}
