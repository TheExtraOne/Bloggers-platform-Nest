import { BaseWithId } from '../../../../../core/base-entities/base.entity';
import { Column, Entity } from 'typeorm';

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
  @Column({ type: 'varchar', length: 15, nullable: false })
  public name: string;

  /**
   * The description of the blog
   * @type {string}
   */
  @Column({ type: 'varchar', length: 500, nullable: false })
  public description: string;

  /**
   * The URL of the blog's website
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  public websiteUrl: string;

  /**
   * Indicates if the blog has membership features enabled
   * @type {boolean}
   * @default false
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  public isMembership: boolean;

  // @OneToMany(() => Posts, (posts) => posts.blog)
  // sessions: Posts[];
}
