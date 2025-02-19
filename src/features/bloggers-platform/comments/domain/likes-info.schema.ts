import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// TODO: remove likesCount and dislikesCount. Will do a request to DB to get count of likes and dislikes
@Schema({
  _id: false,
})
export class LikesInfo {
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;
}

export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);
