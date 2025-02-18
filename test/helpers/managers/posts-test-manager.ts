import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../../../src/features/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { PostsViewDto } from '../../../src/features/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { CreateCommentInputDto } from '../../../src/features/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { CommentsViewDto } from '../../../src/features/bloggers-platform/comments/api/view-dto/comment.view-dto';

export class PostsTestManager {
  constructor(private app: INestApplication) {}

  async createPost(
    createModel: CreatePostInputDto,
    statusCode: number = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<PostsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.POSTS}`)
      .auth(username, password)
      .send(createModel)
      .expect(statusCode);

    return response.body;
  }

  async updatePost(
    id: string,
    updateModel: UpdatePostInputDto,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.POSTS}/${id}`)
      .auth(username, password)
      .send(updateModel)
      .expect(statusCode);
  }

  async deletePost(
    id: string,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.POSTS}/${id}`)
      .auth(username, password)
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

  async createComment(
    postId: string,
    dto: CreateCommentInputDto,
    accessToken: string,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<CommentsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.POSTS}/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(statusCode);

    return response.body;
  }

  async getPostComments(
    postId: string,
    query: { pageNumber?: number; pageSize?: number } = {},
    statusCode: number = HttpStatus.OK,
  ): Promise<any> {
    const queryString = new URLSearchParams({
      pageNumber: (query.pageNumber || 1).toString(),
      pageSize: (query.pageSize || 10).toString(),
    }).toString();

    const response = await request(this.app.getHttpServer())
      .get(`/${PATHS.POSTS}/${postId}/comments?${queryString}`)
      .expect(statusCode);

    return response.body;
  }
}
