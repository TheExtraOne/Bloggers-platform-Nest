import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum EmailConfirmationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
}

@Schema({
  _id: false,
})
export class EmailConfirmation {
  // TODO: required: false, type string| null
  @Prop({ type: String, required: true })
  confirmationCode: string;
  // TODO: required: false, type string| null
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

  // TODO: implement static methods
  // static createConfirmedInstance() {
  //   const instance = new EmailConfirmation();
  // }
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
