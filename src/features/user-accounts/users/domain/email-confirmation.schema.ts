import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum EmailConfirmationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
}

class CreateEmailConfirmationDto {
  confirmationCode: string | null;
  expirationDate: Date | null;
  confirmationStatus: EmailConfirmationStatus;
}

export class SetNewConfirmationDataDto {
  confirmationCode: string | null;
  expirationDate: Date | null;
  confirmationStatus: EmailConfirmationStatus;
}

@Schema({
  _id: false,
})
export class EmailConfirmation {
  @Prop({ type: String, required: false, default: null, nullable: true })
  confirmationCode: string | null;

  @Prop({
    type: Date,
    required: false,
    default: null,
    nullable: true,
  })
  expirationDate: Date | null;

  @Prop({
    type: String,
    enum: EmailConfirmationStatus,
    required: false,
    default: EmailConfirmationStatus.Pending,
  })
  confirmationStatus: EmailConfirmationStatus;

  /**
   * Factory method to create an EmailConfirmation instance
   * @param {CreateUserDto} dto - The data transfer object for user creation
   * @returns {EmailConfirmation} The created EmailConfirmation document
   */
  static createInstance(dto: CreateEmailConfirmationDto): EmailConfirmation {
    const emailConfirmation = new this();
    emailConfirmation.confirmationCode = dto.confirmationCode;
    emailConfirmation.expirationDate = dto.expirationDate;
    emailConfirmation.confirmationStatus = dto.confirmationStatus;

    return emailConfirmation;
  }

  /**
   * Updates the EmailConfirmation instance when user confirm email
   */
  confirmEmail() {
    this.confirmationStatus = EmailConfirmationStatus.Confirmed;
    this.expirationDate = null;
    this.confirmationCode = null;
  }

  /**
   * Updates the EmailConfirmation instance with new data
   */
  setNewConfirmationData(dto: SetNewConfirmationDataDto) {
    this.confirmationCode = dto.confirmationCode;
    this.expirationDate = dto.expirationDate;
    this.confirmationStatus = dto.confirmationStatus;
  }
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);

// Register entities methods in schema
EmailConfirmationSchema.loadClass(EmailConfirmation);
