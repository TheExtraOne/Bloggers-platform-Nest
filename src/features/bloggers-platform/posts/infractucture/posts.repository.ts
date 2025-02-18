import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { ObjectId } from 'mongodb';
import { ERRORS } from '../../../../constants';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async save(post: PostDocument): Promise<void> {
    await post.save();
  }

  async findPostById(id: string): Promise<PostDocument> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    const post = await this.PostModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!post) throw new NotFoundException(ERRORS.POST_NOT_FOUND);

    return post;
  }
}
