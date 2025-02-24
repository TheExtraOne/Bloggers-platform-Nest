import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum PasswordRecoveryStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
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
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
