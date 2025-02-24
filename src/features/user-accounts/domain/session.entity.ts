import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateSessionDomainDto } from './dto/create-session.domain.dto';

// TODO: add validation for schema
// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * Session Entity Schema
 * This class represents the schema and behavior of a Session entity.
 */
@Schema({ timestamps: true })
export class Session {
  /**
   * IP of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  ip: string;

  /**
   * Title of the browser (user-agent)
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  title: string;

  /**
   * Id of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * deviceId of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  deviceId: string;

  /**
   * lastActiveDate = iat of refresh token
   * @type string
   */
  @Prop({ type: String, required: true })
  lastActiveDate: string;

  /**
   * expirationDate = exp of refresh token
   * @type string
   */
  @Prop({ type: String, required: true })
  expirationDate: string;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  // TODO: use deviceId instead of _id?
  /**
   * Factory method to create a Session instance
   * @param {CreateSessionDomainDto} dto - The data transfer object for user creation
   * @returns {SessionDocument} The created session document
   */
  static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();
    session.deviceId = dto.deviceId;
    session.ip = dto.ip;
    session.title = dto.title;
    session.lastActiveDate = dto.lastActiveDate;
    session.expirationDate = dto.expirationDate;
    session.userId = dto.userId;

    return session as SessionDocument;
  }

  /**
   * Marks the session as deleted
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
  //  * Updates the user instance with new data
  //  * @param {string} passwordHash - Hashed password of the user
  //  */
  // updateLoginPassword({ passwordHash }: { passwordHash: string }) {
  //   this.passwordHash = passwordHash;
  // }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Register entities methods in schema
SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
