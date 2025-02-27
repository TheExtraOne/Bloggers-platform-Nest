import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import {
  EmailConfirmationSchema,
  EmailConfirmation,
  EmailConfirmationStatus,
} from './email-confirmation.schema';
import { add } from 'date-fns';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
  PasswordRecoveryStatus,
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
    user.passwordRecovery = {
      recoveryCode: null,
      expirationDate: null,
      recoveryStatus: null,
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
   * @param {EmailConfirmationStatus} status - Status of the confirmation
   * @param {string} confirmationCode - Code for confirmation
   * @param {Date} expirationDate - Date when the confirmation code expires
   */
  updateEmailConfirmation({
    status,
    confirmationCode,
    expirationDate,
  }: {
    status?: EmailConfirmationStatus;
    confirmationCode?: string;
    expirationDate?: Date;
  }) {
    if (status) this.emailConfirmation.confirmationStatus = status;
    if (confirmationCode)
      this.emailConfirmation.confirmationCode = confirmationCode;
    if (expirationDate) this.emailConfirmation.expirationDate = expirationDate;
  }

  /**
   * Updates the user instance with new data
   * Resets password recovery confirmation if email is updated
   * @param {PasswordRecoveryStatus} recoveryStatus - Status of the password recovery
   * @param {string} recoveryCode - Code for password recovery
   * @param {Date} expirationDate - Date when the recovery code expires
   */
  updateRecoveryPassword({
    recoveryStatus,
    recoveryCode,
    expirationDate,
  }: {
    recoveryStatus?: PasswordRecoveryStatus | null;
    recoveryCode?: string | null;
    expirationDate?: Date | null;
  }) {
    if (recoveryStatus) this.passwordRecovery.recoveryStatus = recoveryStatus;
    if (recoveryCode) this.passwordRecovery.recoveryCode = recoveryCode;
    if (expirationDate) this.passwordRecovery.expirationDate = expirationDate;
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
