import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';
import { TPgPost } from './query/pg.posts.query-repository';

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
    WITH inserted_post AS (
      INSERT INTO public.posts (title, content, short_description, blog_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    ),
      posts_likes_information AS (
        INSERT INTO public.posts_likes_information (post_id)
        SELECT id
        FROM inserted_post
      )
    SELECT id FROM inserted_post;
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

  async findPostById(postId: string): Promise<TPgPost | null> {
    if (!this.isCorrectNumber(postId)) {
      return null;
    }
    const query = `
      SELECT posts.*
      FROM public.posts as posts
      WHERE posts.id = $1
      AND posts.deleted_at IS NULL
    `;
    const params = [postId];
    const result = await this.dataSource.query(query, params);
    const post = result[0];

    if (!post) {
      return null;
    }

    return post;
  }

  async updateLikesCount(
    postId: string,
    likesCount: number,
    dislikesCount: number,
  ): Promise<void> {
    const query = `
      UPDATE public.posts_likes_information
      SET likes_count = $1, dislikes_count = $2, updated_at = NOW()
      WHERE post_id = $3;
    `;
    const params = [likesCount, dislikesCount, postId];
    await this.dataSource.query(query, params);
  }
}
