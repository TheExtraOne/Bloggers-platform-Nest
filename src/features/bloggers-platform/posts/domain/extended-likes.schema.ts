import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NewestLikes, NewestLikesSchema } from './newestLikes.schema';

@Schema({
  _id: false,
})
export class ExtendedLikesInfo {
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  @Prop({ type: [NewestLikesSchema], required: true, default: [] })
  newestLikes: NewestLikes[];
}

export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);
