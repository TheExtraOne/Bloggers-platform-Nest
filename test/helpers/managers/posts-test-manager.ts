import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../../../src/features/bloggers-platform/api/input-dto/posts.input-dto';
import { PostsViewDto } from '../../../src/features/bloggers-platform/api/view-dto/posts.view-dto';

export class PostsTestManager {
  constructor(private app: INestApplication) {}

  async createPost(
    createModel: CreatePostInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<PostsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.POSTS}`)
      .send(createModel)
      .expect(statusCode);

    return response.body;
  }

  async updatePost(
    id: string,
    updateModel: UpdatePostInputDto,
    statusCode: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.POSTS}/${id}`)
      .send(updateModel)
      .expect(statusCode);
  }

  async deletePost(
    id: string,
    statusCode: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.POSTS}/${id}`)
      .expect(statusCode);
  }

  async createSeveralPosts(blogId: string, count: number) {
    const posts = [] as PostsViewDto[];

    for (let i = 0; i < count; ++i) {
      const response = await this.createPost({
        title: `post${i}`,
        shortDescription: `description of post${i}`,
        content: `content of post${i}`,
        blogId,
      });

      posts.push(response);
    }

    return posts;
  }
}
