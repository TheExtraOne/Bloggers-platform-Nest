import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import { UpdateCommentInputDto } from '../../../src/features/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { CommentsViewDto } from '../../../src/features/bloggers-platform/comments/api/view-dto/comment.view-dto';
import { UpdateLikeStatusInputDto } from '../../../src/features/bloggers-platform/likes/api/input-dto/update-like-input.dto';

export class CommentsTestManager {
  constructor(private readonly app: INestApplication) {}

  async getCommentById(
    id: string,
    accessToken?: string,
    expectedStatusCode = 200,
  ): Promise<CommentsViewDto> {
    const req = request(this.app.getHttpServer())
      .get(`/${PATHS.COMMENTS}/${id}`);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await req.expect(expectedStatusCode);
    return response.body;
  }

  async updateComment(
    id: string,
    dto: UpdateCommentInputDto,
    accessToken: string,
    expectedStatusCode = 204,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.COMMENTS}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatusCode);
  }

  async deleteComment(
    id: string,
    accessToken: string,
    expectedStatusCode = 204,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.COMMENTS}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatusCode);
  }

  async updateCommentLikeStatus(
    id: string,
    updateLikeStatusDto: UpdateLikeStatusInputDto,
    accessToken: string,
    expectedStatusCode = 204,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.COMMENTS}/${id}/like-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateLikeStatusDto)
      .expect(expectedStatusCode);
  }
}
