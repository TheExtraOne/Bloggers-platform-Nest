import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateLikeDto } from './dto/create-like.dto';
// import { CreateCommentDto } from './dto/create-comment.dto';
// import {
//   CommentatorInfoSchema,
//   CommentatorInfo,
// } from './commentator-info.schema';
// import { LikesInfoSchema, LikesInfo } from './likes-info.schema';
// import { UpdateCommentDto } from './dto/update-comment.dto';

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * Like Entity Schema
 * This class represents the schema and behavior of a Like entity.
 */
@Schema({ timestamps: true })
export class Like {
  /**
   * Status of the like
   * @type {string}
   * @required
   */
  @Prop({
    type: String,
    enum: LikeStatus,
    required: true,
    default: LikeStatus.None,
  })
  status: string;

  /**
   * Login of the author who created a like
   * @type {string}
   */
  @Prop({ type: String, required: true })
  authorLogin: string;

  /**
   * authorId who created a like
   * @type {string}
   */
  @Prop({ type: String, required: true })
  authorId: string;

  /**
   * parentId of the content, to which the like was applied (post ot comment)
   * @type {string}
   */
  @Prop({ type: String, required: true })
  parentId: string;

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
   * Factory method to create a Like instance
   * @param {CreateCommentDto} dto - The data transfer object for comment creation
   * @returns {LikeDocument} The created comment document
   */
  static createInstance(dto: CreateLikeDto): LikeDocument {
    const like = new this();
    like.status = dto.status;
    like.authorLogin = dto.authorLogin;
    like.authorId = dto.authorId;
    like.parentId = dto.parentId;

    return like as LikeDocument;
  }

  /**
   * Marks the like as deleted
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
   * Updates the like instance with new data
   * @param {LikeStatus} dto - The data transfer object for like updates
   */
  update(dto: { status: LikeStatus }) {
    this.status = dto.status;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Register entities methods in schema
LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<LikeDocument> & typeof Like;
