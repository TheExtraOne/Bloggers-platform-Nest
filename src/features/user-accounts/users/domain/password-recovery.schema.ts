import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum PasswordRecoveryStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
}

export class SetNewPasswordRecoveryDataDto {
  recoveryCode: string;
  expirationDate: Date;
}

@Schema({
  _id: false,
})
export class PasswordRecovery {
  @Prop({ type: String, required: false, default: null, nullable: true })
  recoveryCode: string | null;

  @Prop({
    type: Date,
    required: false,
    default: null,
    nullable: true,
  })
  expirationDate: Date | null;

  @Prop({
    type: String,
    enum: PasswordRecoveryStatus,
    required: false,
    default: null,
    nullable: true,
  })
  recoveryStatus: PasswordRecoveryStatus | null;

  static createInstance() {
    const passwordRecovery = new PasswordRecovery();

    passwordRecovery.recoveryCode = null;
    passwordRecovery.expirationDate = null;
    passwordRecovery.recoveryStatus = null;

    return passwordRecovery;
  }

  setNewPasswordRecoveryData(dto: SetNewPasswordRecoveryDataDto) {
    this.recoveryCode = dto.recoveryCode;
    this.expirationDate = dto.expirationDate;
    this.recoveryStatus = PasswordRecoveryStatus.Pending;
  }

  confirmRecovery() {
    this.recoveryStatus = PasswordRecoveryStatus.Confirmed;
    this.expirationDate = null;
    this.recoveryCode = null;
  }
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);

// Register entities methods in schema
PasswordRecoverySchema.loadClass(PasswordRecovery);
