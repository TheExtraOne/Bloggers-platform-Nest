import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
  EmailConfirmationStatus,
  SetNewConfirmationDataDto,
} from './email-confirmation.schema';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
  SetNewPasswordRecoveryDataDto,
} from './password-recovery.schema';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]*$/,
  isUnique: true,
};

export const emailConstraints = {
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  isUnique: true,
};

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
  @Prop({ type: String, required: true, ...loginConstraints })
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
  @Prop({ type: String, required: true, ...emailConstraints })
  email: string;

  // @Prop(EmailConfirmationSchema) contains confirmation code, date of expire and confirmation status
  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

  // @Prop(PasswordRecoverySchema) contains recovery code, date of expire and recovery status
  @Prop({ type: PasswordRecoverySchema })
  passwordRecovery: PasswordRecovery;

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
   * @param {CreateUserDomainDto} dto - The data transfer object for user creation
   * @returns {UserDocument} The created user document
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const {
      email,
      passwordHash,
      login,
      confirmationCode,
      expirationDate,
      confirmationStatus,
    } = dto;

    const user = new this();

    user.email = email;
    user.passwordHash = passwordHash;
    user.login = login;
    user.emailConfirmation = EmailConfirmation.createInstance({
      confirmationCode,
      expirationDate,
      confirmationStatus,
    });
    user.passwordRecovery = PasswordRecovery.createInstance();

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
   * Confirms the email
   */
  confirmEmail() {
    this.emailConfirmation.confirmEmail();
  }

  /**
   * Updates the EmailConfirmation instance with new data
   */
  setNewConfirmationData(dto: SetNewConfirmationDataDto) {
    this.emailConfirmation.setNewConfirmationData(dto);
  }

  /**
   * Confirms the password recovery
   */
  confirmPasswordRecovery() {
    this.passwordRecovery.confirmRecovery();
  }

  /**
   * Updates the password recovery instance with new data
   * @param {SetNewPasswordRecoveryDataDto} dto - Data for updating the password recovery
   */
  setNewPasswordRecoveryData(dto: SetNewPasswordRecoveryDataDto) {
    this.passwordRecovery.setNewPasswordRecoveryData(dto);
  }

  /**
   * Updates the user instance with new data
   * @param {string} passwordHash - Hashed password of the user
   */
  updateLoginPassword({ passwordHash }: { passwordHash: string }) {
    this.passwordHash = passwordHash;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create TTL index on emailConfirmation.expirationDate for unconfirmed users
UserSchema.index(
  { 'emailConfirmation.expirationDate': 1 },
  {
    expireAfterSeconds: 2 * 24 * 60 * 60,
    partialFilterExpression: {
      'emailConfirmation.confirmationStatus': EmailConfirmationStatus.Pending,
    },
  },
);

// Register entities methods in schema
UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
