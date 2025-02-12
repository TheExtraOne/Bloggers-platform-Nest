import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
  EmailConfirmationStatus,
} from './email-confirmation.schema';
import { add } from 'date-fns';

// Flags for timestamps automatically will add createdAt and updatedAt fields
/**
 * User Entity Schema
 * This class represents the schema and behavior of a User entity.
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Login of the user (must be uniq)
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  login: string;

  /**
   * Password hash for authentication
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  /**
   * Email of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  email: string;

  // TODO: delete after 2 days?

  // @Prop(EmailConfirmationSchema) contains confirmation code, date of expire and confirmation status
  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

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
   * Factory method to create a User instance
   * @param {CreateUserDto} dto - The data transfer object for user creation
   * @returns {UserDocument} The created user document
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.emailConfirmation = {
      confirmationCode: dto.confirmationCode,
      expirationDate: add(new Date(), { hours: 1, minutes: 30 }),
      confirmationStatus: EmailConfirmationStatus.Pending,
    };

    return user as UserDocument;
  }

  /**
   * Marks the user as deleted
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
   * Updates the user instance with new data
   * Resets email confirmation if email is updated
   * @param {UpdateUserDto} dto - The data transfer object for user updates
   */
  //   update(dto: UpdateUserDto) {
  //     if (dto.email !== this.email) {
  //       this.isEmailConfirmed = false;
  //     }
  //     this.email = dto.email;
  //   }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Register entities methods in schema
UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
