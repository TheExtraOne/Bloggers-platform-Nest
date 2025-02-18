import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import { LikesInfo, LikesInfoSchema } from './likes-info.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * Comment Entity Schema
 * This class represents the schema and behavior of a Comment entity.
 */
@Schema({ timestamps: true })
export class Comment {
  /**
   * Content of the comment
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  content: string;

  /**
   * PostId for which comment was created
   * @type {string}
   */
  @Prop({ type: String, required: true })
  postId: string;

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
   * CommentatorInfo
   * @type {CommentatorInfo} contains userId and userLogin
   * @required
   */
  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;

  /**
   * LikesInfo
   * @type {LikesInfo} contains likesCount and dislikesCount
   * @required
   */
  @Prop({ type: LikesInfoSchema, required: true })
  likesInfo: LikesInfo;

  /**
   * Factory method to create a Comment instance
   * @param {CreateCommentDto} dto - The data transfer object for comment creation
   * @returns {CommentDocument} The created comment document
   */
  static createInstance(dto: CreateCommentDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.commentatorInfo = dto.commentatorInfo;
    comment.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
    };

    return comment as CommentDocument;
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
  //  * Updates the post instance with new data
  //  * @param {UpdatePostDto} dto - The data transfer object for post updates
  //  */
  // update(dto: UpdatePostDto) {
  //   this.title = dto.title;
  //   this.shortDescription = dto.shortDescription;
  //   this.content = dto.content;
  //   this.blogId = dto.blogId;
  //   this.blogName = dto.blogName;
  // }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Register entities methods in schema
CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
