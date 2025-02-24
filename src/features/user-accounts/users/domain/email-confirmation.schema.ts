import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum EmailConfirmationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
}

@Schema({
  _id: false,
})
export class EmailConfirmation {
  @Prop({ type: String, required: true })
  confirmationCode: string;

  @Prop({
    type: Date,
    required: true,
  })
  expirationDate: Date;

  @Prop({
    type: String,
    enum: EmailConfirmationStatus,
    required: true,
  })
  confirmationStatus: EmailConfirmationStatus;
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
