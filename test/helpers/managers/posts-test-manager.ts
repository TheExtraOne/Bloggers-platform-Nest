import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../../../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { PgPostsViewDto } from '../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { CreateCommentInputDto } from '../../../src/modules/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { PgCommentsViewDto } from '../../../src/modules/bloggers-platform/comments/api/view-dto/comment.view-dto';
import { UpdateLikeStatusInputDto } from '../../../src/modules/bloggers-platform/likes/api/input-dto/update-like-input.dto';

export class PostsTestManager {
  constructor(private app: INestApplication) {}

  async createPost(
    blogId: string,
    createModel: Omit<CreatePostInputDto, 'blogId'>,
    statusCode: number = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<PgPostsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.SA_BLOGS}/${blogId}/posts`)
      .auth(username, password)
      .send(createModel)
      .expect(statusCode);

    return response.body;
  }

  async updatePost(
    blogId: string,
    postId: string,
    updateModel: UpdatePostInputDto,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.SA_BLOGS}/${blogId}/${PATHS.POSTS}/${postId}`)
      .auth(username, password)
      .send(updateModel)
      .expect(statusCode);
  }

  async deletePost(
    blogId: string,
    postId: string,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.SA_BLOGS}/${blogId}/${PATHS.POSTS}/${postId}`)
      .auth(username, password)
      .expect(statusCode);
  }

  async createSeveralPosts(blogId: string, count: number) {
    const posts = [] as PgPostsViewDto[];

    for (let i = 0; i < count; ++i) {
      const response = await this.createPost(blogId, {
        title: `post${i}`,
        shortDescription: `description of post${i}`,
        content: `content of post${i}`,
      });

      posts.push(response);
    }

    return posts;
  }

  async getPostById(
    id: string,
    accessToken?: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<PgPostsViewDto> {
    const req = request(this.app.getHttpServer()).get(`/${PATHS.POSTS}/${id}`);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await req.expect(statusCode);
    return response.body;
  }

  async createComment(
    postId: string,
    dto: CreateCommentInputDto,
    accessToken: string,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<PgCommentsViewDto> {
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

  async updatePostLikeStatus(
    id: string,
    updateLikeStatusDto: UpdateLikeStatusInputDto,
    accessToken: string,
    expectedStatusCode = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.POSTS}/${id}/like-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateLikeStatusDto)
      .expect(expectedStatusCode);
  }
}
