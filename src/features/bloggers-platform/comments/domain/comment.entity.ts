import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CommentatorInfoSchema,
  CommentatorInfo,
} from './commentator-info.schema';
import { LikesInfoSchema, LikesInfo } from './likes-info.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';

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
  @Prop({ type: String, required: true, minLength: 20, maxLength: 300 })
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
   * Marks the comment as deleted
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
   * Updates the comment instance with new data
   * @param {UpdateCommentDto} dto - The data transfer object for comment updates
   */
  update(dto: UpdateCommentDto) {
    this.content = dto.content;
  }

  updateLikesCount(likesCount: number) {
    this.likesInfo.likesCount = likesCount;
  }

  updateDislikesCount(dislikesCount: number) {
    this.likesInfo.dislikesCount = dislikesCount;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Register entities methods in schema
CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
