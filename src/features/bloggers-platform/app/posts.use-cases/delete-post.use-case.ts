import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../../infrastructure/posts.repository';

@Injectable()
export class DeletePostUseCase {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(id: string): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    post.makeDeleted();

    await this.postsRepository.save(post);
  }
}
