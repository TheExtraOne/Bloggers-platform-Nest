import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';

@Injectable()
export class PgPostsRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createPost(dto: {
    title: string;
    content: string;
    shortDescription: string;
    blogId: string;
  }): Promise<{ postId: string }> {
    const { title, content, shortDescription, blogId } = dto;
    const query = `
      INSERT INTO public.posts (title, content, short_description, blog_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const params = [title, content, shortDescription, blogId];
    const result = await this.dataSource.query(query, params);

    return { postId: result[0].id };
  }

  async updatePost(
    postId: string,
    blogId: string,
    dto: {
      title: string;
      content: string;
      shortDescription: string;
    },
  ): Promise<void> {
    if (!this.isCorrectNumber(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const { title, content, shortDescription } = dto;
    const query = `
      UPDATE public.posts
      SET title = $1, content = $2, short_description = $3, updated_at = $4
      WHERE id = $5 AND deleted_at IS NULL AND blog_id = $6;
    `;
    const params = [
      title,
      content,
      shortDescription,
      new Date(),
      postId,
      blogId,
    ];
    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
  }

  async deletePost(postId: string, blogId: string): Promise<void> {
    if (!this.isCorrectNumber(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const query = `
      UPDATE public.posts
      SET deleted_at = $1
      WHERE id = $2 AND deleted_at IS NULL AND blog_id = $3;
    `;
    const params = [new Date(), postId, blogId];
    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
  }
}
