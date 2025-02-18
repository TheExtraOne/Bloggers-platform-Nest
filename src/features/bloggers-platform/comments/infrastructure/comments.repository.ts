import { Injectable } from '@nestjs/common';
import { CommentDocument } from '../domain/comment.entity';

@Injectable()
export class CommentsRepository {
  // constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType) {}

  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }

  // async findPostById(id: string): Promise<CommentDocument> {
  //   if (!ObjectId.isValid(id))
  //     throw new NotFoundException(ERRORS.POST_NOT_FOUND);

  //   const post = await this.PostModel.findOne({
  //     _id: new ObjectId(id),
  //     deletedAt: null,
  //   });

  //   if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

  //   return post;
  // }
}
