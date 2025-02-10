import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';

// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * Post Entity Schema
 * This class represents the schema and behavior of a Post entity.
 */
@Schema({ timestamps: true })
export class Post {
  /**
   * Title of the post
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  title: string;

  /**
   * ShortDescription of the post
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  shortDescription: string;

  /**
   * Content of the post
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  content: string;

  /**
   * BlogId for which post was created
   * @type {string}
   */
  @Prop({ type: String, required: true })
  blogId: string;

  /**
   * BlogName for which post was created
   * @type {string}
   */
  @Prop({ type: String, required: true })
  blogName: string;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  /**
   * Factory method to create a Post instance
   * @param {CreatePostDto} dto - The data transfer object for post creation
   * @returns {PostDocument} The created post document
   */
  static createInstance(dto: CreatePostDto): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;

    return post as PostDocument;
  }

  /**
   * Marks the blog as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  // /**
  //  * Updates the blog instance with new data
  //  * Updating name, description and websiteUrl
  //  * @param {UpdateBlogInputDto} dto - The data transfer object for blog updates
  //  */
  // update(dto: UpdateBlogInputDto) {
  //   this.name = dto.name;
  //   this.description = dto.description;
  //   this.websiteUrl = dto.websiteUrl;
  // }
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Register entities methods in schema
PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
