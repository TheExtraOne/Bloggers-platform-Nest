import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../api/input-dto/blogs.input-dto';

// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * Blog Entity Schema
 * This class represents the schema and behavior of a Blog entity.
 */
@Schema({ timestamps: true })
export class Blog {
  /**
   * Name of the blog
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, maxLength: 15 })
  name: string;

  /**
   * Description of the blog
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, maxLength: 500 })
  description: string;

  /**
   * websiteUrl of the blog
   * @type {string}
   * @required
   */
  @Prop({
    type: String,
    required: true,
    maxLength: 100,
    match:
      /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  })
  websiteUrl: string;

  /**
   * Flag for checking if blog is a membership blog
   * @type {boolean}
   */
  @Prop({ type: Boolean, default: false })
  isMembership: boolean;

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
   * Factory method to create a Blog instance
   * @param {CreateBlogInputDto} dto - The data transfer object for blog creation
   * @returns {BlogDocument} The created blog document
   */
  static createInstance(dto: CreateBlogInputDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;

    return blog as BlogDocument;
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

  /**
   * Updates the blog instance with new data
   * Updating name, description and websiteUrl
   * @param {UpdateBlogInputDto} dto - The data transfer object for blog updates
   */
  update(dto: UpdateBlogInputDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Register entities methods in schema
BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
